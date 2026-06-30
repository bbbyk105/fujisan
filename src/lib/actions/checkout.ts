"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { order as orderTable, type OrderLine } from "@/db/orders-schema";
import { getFujisanProductBySlug, findVolume } from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { getStripe } from "@/lib/stripe";

/** カートから送られてくる最小限の行（価格はサーバーで引き直す）。 */
type CartInput = { slug: string; ml: number; qty: number };

type StartCheckoutEnv = {
  STRIPE_SECRET_KEY?: string;
  BETTER_AUTH_URL?: string;
};

/** 税込小計から送料を算出（cart-core.shippingFee と同じ規則。サーバー専用に再掲）。 */
function calcShipping(subtotal: number): number {
  const threshold = SHIPPING_FEE.freeThresholdJpy;
  if (threshold > 0 && subtotal >= threshold) return 0;
  return SHIPPING_FEE.flatJpy;
}

/** "FJ-…" 形式の注文番号（orders.ts と同形式）。 */
function makeOrderRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `FJ-${ts}${rand}`;
}

/**
 * 決済開始。注文を "pending" で永続化し、Stripe Checkout Session を作って
 * その URL（Stripe ホスト型決済ページ）を返す。クライアントはこの URL へ遷移する。
 *
 * 設計:
 * - お届け先（氏名・住所・郵便番号・電話）は **Stripe の決済ページで収集**する
 *   （shipping_address_collection / phone_number_collection）。発送は日本国内のみ
 *   なので allowed_countries は ["JP"] に限定。自前の住所フォーム（/checkout）は廃止。
 * - 注文行はここで pending 保存し、住所等は支払い完了後に Webhook が Stripe から
 *   受け取って書き戻す（pending の住所は空文字で開始）。
 * - 金額はクライアント申告を信用せず、slug + ml からカタログ価格を引き直す。
 * - 認証必須（注文は user に紐づく。ゲスト購入は受け付けない）。
 */
export async function startCheckoutAction(input: {
  items: CartInput[];
  /** サイトの表示言語。Stripe 決済ページの言語をこれに合わせる（既定: ja）。 */
  locale?: "ja" | "en";
}): Promise<
  | { ok: true; url: string }
  | { ok: false; error: "unauth" | "invalid" | "config" | "stripe" | "db" }
> {
  // 認証チェック
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id?: string; email?: string; name?: string }
    | undefined;
  if (!user?.id) return { ok: false, error: "unauth" };

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "invalid" };
  }

  // 価格をサーバー側で引き直して明細を組み立てる（改ざん防止）
  const items: OrderLine[] = [];
  for (const ci of input.items) {
    const product = getFujisanProductBySlug(ci.slug);
    if (!product) return { ok: false, error: "invalid" };
    const volume = findVolume(product, ci.ml);
    if (!volume) return { ok: false, error: "invalid" };
    const qty = Math.floor(ci.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 12) {
      return { ok: false, error: "invalid" };
    }
    items.push({
      slug: product.slug,
      name: product.name,
      variant: product.variant,
      ml: volume.ml,
      qty,
      unitPrice: volume.priceJpy,
      lineTotal: volume.priceJpy * qty,
    });
  }

  const itemsCount = items.reduce((n, it) => n + it.qty, 0);
  const subtotal = items.reduce((n, it) => n + it.lineTotal, 0);
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;

  // 環境（Stripe 秘密鍵・サイト URL）
  const { env } = await getCloudflareContext({ async: true });
  const e = env as StartCheckoutEnv;
  if (!e.STRIPE_SECRET_KEY) return { ok: false, error: "config" };
  const baseUrl = (e.BETTER_AUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  // 注文を pending で保存。お届け先は支払い完了時に Webhook が Stripe から書き戻すため空で開始。
  const id = crypto.randomUUID();
  const orderRef = makeOrderRef();
  try {
    const db = await getDb();
    await db.insert(orderTable).values({
      id,
      userId: user.id,
      orderRef,
      status: "pending",
      itemsJson: JSON.stringify(items),
      itemsCount,
      subtotal,
      shipping,
      total,
      customerName: (user.name ?? "").trim(),
      customerEmail: (user.email ?? "").trim(),
      postalCode: "",
      address: "",
      phone: "",
    });
  } catch {
    return { ok: false, error: "db" };
  }

  // Stripe Checkout Session を生成
  const stripe = getStripe(e.STRIPE_SECRET_KEY);
  const lineItems = items.map((it) => ({
    quantity: it.qty,
    price_data: {
      currency: "jpy",
      unit_amount: it.unitPrice, // JPY は最小単位＝円。整数をそのまま渡す。
      product_data: { name: `${it.name} ${it.variant}（${it.ml}ml）` },
    },
  }));
  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: shipping,
        product_data: { name: "配送料 / Shipping" },
      },
    });
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: (user.email ?? "").trim() || undefined,
      // サイトの言語切替（data-locale）に合わせる。auto はブラウザ依存でズレるため使わない。
      locale: input.locale === "en" ? "en" : "ja",
      // お届け先住所を Stripe 側で収集。発送は日本国内のみ。
      shipping_address_collection: { allowed_countries: ["JP"] },
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      // 注文の逆引きキー。Webhook はこれを使って確定する。
      metadata: { orderId: id, orderRef },
      payment_intent_data: { metadata: { orderId: id, orderRef } },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart?canceled=1`,
    });

    if (!checkout.url) {
      const db = await getDb();
      await db.delete(orderTable).where(eq(orderTable.id, id));
      return { ok: false, error: "stripe" };
    }
    return { ok: true, url: checkout.url };
  } catch {
    // Stripe 失敗時は孤立した pending 注文を掃除する
    try {
      const db = await getDb();
      await db.delete(orderTable).where(eq(orderTable.id, id));
    } catch {
      // 掃除に失敗しても致命的ではない（pending のまま残るだけ）
    }
    return { ok: false, error: "stripe" };
  }
}
