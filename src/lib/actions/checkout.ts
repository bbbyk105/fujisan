"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { order as orderTable, type OrderLine } from "@/db/orders-schema";
import { user as userTable } from "@/db/auth-schema";
import { getFujisanProductBySlug, findVolume } from "@/data/fujisan-products";
import { skuId } from "@/db/products-schema";
import { getLiveSkuMap } from "@/lib/catalog";
import { MAX_QTY_PER_LINE } from "@/lib/cart/cart-core";
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
  if (subtotal <= 0) return 0;
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
 * - お届け先は二経路。**登録情報に郵便番号7桁＋住所があればそれを使い**、
 *   Stripe の住所収集を省略する。無ければ **Stripe の決済ページで収集**する
 *   （shipping_address_collection、allowed_countries は ["JP"] 限定）。
 *   自前の住所フォーム（/checkout）は廃止済み。
 * - 注文行はここで pending 保存。登録住所はこの時点で書き込み、Stripe 収集の
 *   場合は支払い完了後に Webhook が書き戻す（Webhook は既存値を空で潰さない）。
 * - 金額はクライアント申告を信用せず、slug + ml からカタログ価格を引き直す。
 * - 認証必須（注文は user に紐づく。ゲスト購入は受け付けない）。
 */
export async function startCheckoutAction(input: {
  items: CartInput[];
  /** サイトの表示言語。Stripe 決済ページの言語をこれに合わせる（既定: ja）。 */
  locale?: "ja" | "en";
  /**
   * 20歳以上であることの確認（カートのチェックボックス）。
   * Server Action は URL さえ判れば直接呼べるため、クライアント側の
   * 無効化だけでは法令上の確認として成立しない。ここで true を必須にする。
   */
  ageConfirmed: boolean;
}): Promise<
  | { ok: true; url: string }
  | {
      ok: false;
      error:
        | "unauth"
        | "invalid"
        | "config"
        | "stripe"
        | "db"
        | "soldout"
        | "stock"
        | "age";
    }
> {
  // 認証チェック
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id?: string; email?: string; name?: string }
    | undefined;
  if (!user?.id) return { ok: false, error: "unauth" };

  // 年齢確認（未成年者飲酒禁止法）。カートの checkbox と二重で担保する。
  if (input.ageConfirmed !== true) return { ok: false, error: "age" };

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "invalid" };
  }

  // 価格と在庫は D1（product_sku）を正とする。クライアント申告は一切信用しない。
  const skuMap = await getLiveSkuMap();

  // 同一 SKU が複数行に分かれて届いても在庫チェックをすり抜けないよう、
  // まず (slug, ml) 単位に本数を合算してから検証する。
  const merged = new Map<string, number>();
  for (const ci of input.items) {
    const product = getFujisanProductBySlug(ci.slug);
    if (!product) return { ok: false, error: "invalid" };
    const volume = findVolume(product, ci.ml);
    if (!volume) return { ok: false, error: "invalid" };
    const qty = Math.floor(ci.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, error: "invalid" };
    }
    const key = skuId(product.slug, volume.ml);
    merged.set(key, (merged.get(key) ?? 0) + qty);
  }

  const items: OrderLine[] = [];
  for (const [key, qty] of merged) {
    const sku = skuMap.get(key);
    if (!sku) return { ok: false, error: "invalid" };
    if (qty > MAX_QTY_PER_LINE) return { ok: false, error: "invalid" };
    // 完売 SKU は決済に進ませない（UI で無効化していても最後の砦としてここで拒否）。
    if (sku.soldOut) return { ok: false, error: "soldout" };
    // 在庫管理対象（stockQty が数値）なら、注文本数が在庫を超えていないか見る。
    // 在庫の確定的な引き落としは決済確定時（Webhook）に原子的に行う。
    if (sku.stockQty !== null && qty > sku.stockQty) {
      return { ok: false, error: "stock" };
    }
    items.push({
      slug: sku.slug,
      name: sku.name,
      variant: sku.variant,
      ml: sku.ml,
      qty,
      unitPrice: sku.priceJpy,
      lineTotal: sku.priceJpy * qty,
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
  // success_url / cancel_url の基底。未設定のまま localhost に落とすと
  // 本番で決済後に戻れなくなるため、黙って握らず設定エラーとして弾く。
  const baseUrl = (e.BETTER_AUTH_URL ?? "").trim().replace(/\/$/, "");
  if (!baseUrl) return { ok: false, error: "config" };

  // 登録済みのお届け先（アカウントの登録情報）。郵便番号7桁＋住所が揃っていれば
  // それを注文に使い、Stripe 決済ページでの住所収集を省略する。
  let savedAddress: {
    postalCode: string;
    address: string;
    phone: string;
    name: string;
  } | null = null;
  const id = crypto.randomUUID();
  const orderRef = makeOrderRef();
  try {
    const db = await getDb();
    const [profile] = await db
      .select({
        name: userTable.name,
        phone: userTable.phone,
        postalCode: userTable.postalCode,
        address: userTable.address,
      })
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);
    const postal = (profile?.postalCode ?? "").trim();
    const addr = (profile?.address ?? "").trim();
    if (/^\d{7}$/.test(postal) && addr.length > 0) {
      savedAddress = {
        postalCode: postal,
        address: addr,
        phone: (profile?.phone ?? "").trim(),
        name: (profile?.name ?? user.name ?? "").trim(),
      };
    }

    // 注文を pending で保存。登録住所があればその場で書き込み、
    // 無ければ空で開始して支払い完了時に Webhook が Stripe から書き戻す。
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
      customerName: savedAddress?.name || (user.name ?? "").trim(),
      customerEmail: (user.email ?? "").trim(),
      postalCode: savedAddress?.postalCode ?? "",
      address: savedAddress?.address ?? "",
      phone: savedAddress?.phone ?? "",
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
      // 登録済みのお届け先があれば Stripe での住所収集を省略（登録住所へ発送）。
      // 無ければ Stripe 決済ページで収集する。発送は日本国内のみ。
      ...(savedAddress
        ? {
            // 電話も未登録の場合だけ Stripe で収集する。
            ...(savedAddress.phone
              ? {}
              : { phone_number_collection: { enabled: true } }),
          }
        : {
            shipping_address_collection: { allowed_countries: ["JP"] },
            phone_number_collection: { enabled: true },
          }),
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
