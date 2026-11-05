"use server";

import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { order as orderTable, type OrderLine } from "@/db/orders-schema";
import { user as userTable } from "@/db/auth-schema";
import { getLiveSkuMap } from "@/lib/catalog";
import { skuKey } from "@/data/fujisan-products";
import { TURNSTILE_SITE_KEY } from "@/data/fujisan-turnstile";
import { MAX_QTY_PER_LINE, shippingFee } from "@/lib/cart/cart-core";
import { applyStockMove } from "@/lib/order-stock";
import {
  releaseStock,
  reserveStock,
  type ShortageLine,
} from "@/lib/inventory";
import { alertOps } from "@/lib/ops-alert";
import { clientIpFrom, consumeRateLimit } from "@/lib/rate-limit";
import { getConsumptionTaxRateId, getStripe } from "@/lib/stripe";
import { verifyTurnstile } from "@/lib/turnstile";
import { guestEmailIssue } from "@/lib/validation/email";

/** カートから送られてくる最小限の行（価格はサーバーで引き直す）。 */
type CartInput = { slug: string; ml: number; qty: number };

type StartCheckoutEnv = {
  TURNSTILE_SECRET_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  BETTER_AUTH_URL?: string;
};

// 送料は cart-core.shippingFee を直接使う。
// 以前はサーバー用に同じ規則を再実装していたが、空カート（小計0円）の扱いが
// 食い違っていた（cart-core は 0 円、こちらは 1,100 円）。規則が 2 か所にあると
// 必ずずれるので、カート表示と決済で同じ関数を共有する。

/**
 * Stripe Checkout Session の有効期限（秒）。
 * Stripe が許すのは 30 分〜24 時間。在庫の押さえっぱなしを短くしたいので下限にする。
 */
const CHECKOUT_EXPIRY_SECONDS = 30 * 60;

/** "FJ-…" 形式の注文番号。 */
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
 * - ログインしていなくても、メールアドレスがあればゲストとして購入できる。注文は
 *   user に紐づかず（`userId` は null）、お届け先は必ず Stripe の決済ページで集める。
 *   ログインなしで在庫を押さえられるので、回数は IP ごとに絞る。
 */
export async function startCheckoutAction(input: {
  items: CartInput[];
  /** サイトの表示言語。Stripe 決済ページの言語をこれに合わせる（既定: ja）。 */
  locale?: "ja" | "en";
  /**
   * カートの「20歳以上」チェック。酒類なのでサーバー側でも必須にする。
   * 以前は checkoutSchema（Zod）で見ていたが、自前の住所フォーム廃止に伴い
   * スキーマごと消えて、クライアントの state だけが残っていた。
   */
  ageConfirmed?: boolean;
  /** ゲスト購入のメールアドレス。ログイン中は使わない。 */
  guestEmail?: string;
  /** ゲスト購入のボット判定のトークン。 */
  turnstileToken?: string;
}): Promise<
  | {
      ok: true;
      url: string;
      /** ブラウザの「戻る」で帰ったときに、画面から解放するための注文番号と鍵。 */
      orderRef: string;
      guestKey?: string;
    }
  | {
      ok: false;
      error:
        | "unauth"
        | "invalid"
        | "config"
        | "stripe"
        | "db"
        | "soldout"
        | "age"
        | "rate"
        | "bot";
      /** soldout のとき、どの SKU が何本まで買えるか。UI で名指しするのに使う。 */
      shortages?: ShortageLine[];
    }
> {
  // 認証チェック
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id?: string; email?: string; name?: string }
    | undefined;
  const userId = user?.id ?? null;
  if (!userId && input.guestEmail === undefined) {
    return { ok: false, error: "unauth" };
  }

  // 20歳以上の確認。酒類の販売なので、UI のチェックボックスだけに頼らず
  // サーバー側でも必須にする（アクションは直接呼べるため）。
  if (input.ageConfirmed !== true) return { ok: false, error: "age" };

  if (!userId && guestEmailIssue(input.guestEmail)) {
    return { ok: false, error: "invalid" };
  }
  const customerEmail = (userId ? user?.email : input.guestEmail)?.trim() ?? "";

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "invalid" };
  }

  // 価格をサーバー側で引き直して明細を組み立てる（改ざん防止）。
  // 引き直しの出どころは実勢カタログ（コードの定数 + D1 の価格上書き）。
  // カタログ定数を直接読むと、管理画面で変えた価格が決済に効かない。
  const live = await getLiveSkuMap();
  const items: OrderLine[] = [];
  // 本数の上限は 1 行ごとなので、同じ商品を複数行に分けるとすり抜ける。カートは
  // 1 商品 1 行なので、分かれていれば画面を通っていない入力として弾く。
  const seen = new Set<string>();
  for (const ci of input.items) {
    if (seen.has(skuKey(ci.slug, ci.ml))) return { ok: false, error: "invalid" };
    seen.add(skuKey(ci.slug, ci.ml));
    const sku = live.get(skuKey(ci.slug, ci.ml));
    if (!sku) return { ok: false, error: "invalid" };
    // カタログ側で販売停止にした SKU は決済に進ませない
    // （UI で無効化していても最後の砦としてここで拒否）。
    // 在庫切れはこの先の reserveStock が「どれが何本まで買えるか」付きで返すので、
    // ここでは見ない — ここで弾くと、その情報を UI に渡せなくなる。
    if (sku.catalogSoldOut) return { ok: false, error: "soldout" };
    // 申告値をそのまま検証する。以前は Math.floor() してから
    // Number.isInteger() を見ていたため、小数（1.5 → 1）が常に整数判定を
    // 通り抜けて黙って切り捨てられていた。上限はカート UI と同じ定数を使う。
    const qty = ci.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, error: "invalid" };
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
  const shipping = shippingFee(subtotal);
  const total = subtotal + shipping;

  // 環境（Stripe 秘密鍵・サイト URL）
  const { env } = await getCloudflareContext({ async: true });
  const e = env as StartCheckoutEnv;
  if (!e.STRIPE_SECRET_KEY) return { ok: false, error: "config" };
  const baseUrl = (e.BETTER_AUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  // ボット判定はサイトキーと秘密鍵の両方がそろってから。片方だけで判定すると、
  // ウィジェットが無いのにトークンを求めて、ゲスト全員が止まる。
  const turnstileSecret =
    !userId && TURNSTILE_SITE_KEY ? e.TURNSTILE_SECRET_KEY : undefined;

  // トークンの無い要求は問い合わせるまでもなく止める。
  if (turnstileSecret && !input.turnstileToken) {
    return { ok: false, error: "bot" };
  }

  if (!userId) {
    const ip = clientIpFrom(await headers());

    // 判定を通ってから数える。入力の検証と同じで、落ちる要求に回数の枠を使わせると、
    // ボットが同じ IP のお客様を締め出せる。
    if (turnstileSecret) {
      const passed = await verifyTurnstile({
        secret: turnstileSecret,
        token: input.turnstileToken,
        ip,
      });
      if (!passed) return { ok: false, error: "bot" };
    }

    const limit = await consumeRateLimit({ bucket: "guestCheckout", ip });
    if (!limit.ok) return { ok: false, error: "rate" };
  }

  // 登録済みのお届け先（アカウントの登録情報）。郵便番号7桁＋住所が揃っていれば
  // それを注文に使い、Stripe 決済ページでの住所収集を省略する。ゲストには無いので、
  // 下の Session で住所と電話番号を必須で集める。
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
    if (userId) {
      const [profile] = await db
        .select({
          name: userTable.name,
          phone: userTable.phone,
          postalCode: userTable.postalCode,
          address: userTable.address,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);
      const postal = (profile?.postalCode ?? "").trim();
      const addr = (profile?.address ?? "").trim();
      if (/^\d{7}$/.test(postal) && addr.length > 0) {
        savedAddress = {
          postalCode: postal,
          address: addr,
          phone: (profile?.phone ?? "").trim(),
          name: (profile?.name ?? user?.name ?? "").trim(),
        };
      }
    }

    // 注文を pending で保存。登録住所があればその場で書き込み、
    // 無ければ空で開始して支払い完了時に Webhook が Stripe から書き戻す。
    await db.insert(orderTable).values({
      id,
      userId,
      orderRef,
      status: "pending",
      itemsJson: JSON.stringify(items),
      itemsCount,
      subtotal,
      shipping,
      total,
      customerName: savedAddress?.name || (user?.name ?? "").trim(),
      customerEmail,
      postalCode: savedAddress?.postalCode ?? "",
      address: savedAddress?.address ?? "",
      phone: savedAddress?.phone ?? "",
    });
  } catch {
    return { ok: false, error: "db" };
  }

  // 在庫を引き当てる（注文を保存した直後、Stripe へ送り出す前）。
  // 決済ページに滞在している数分のあいだ押さえておかないと、同じ最後の 1 本を
  // 複数人が同時に買えてしまう。管理対象外の SKU は素通りする。
  const reservation = await reserveStock(items);
  if (!reservation.ok) {
    // 押さえられなかったので、作りかけの pending 注文を消して引き返す。
    await deletePendingOrder(id);
    if (reservation.reason === "shortage") {
      return { ok: false, error: "soldout", shortages: reservation.shortages };
    }
    return { ok: false, error: "db" };
  }

  // Stripe Checkout Session を生成
  const stripe = getStripe(e.STRIPE_SECRET_KEY);
  // 領収書は Stripe が出すので、税率と宛先はここで渡した内容がそのまま載る。
  const taxRateId = await getConsumptionTaxRateId(stripe);
  if (!taxRateId) {
    // 決済は止めないが、この注文の領収書には税率が載らない（後から足せない）。
    await alertOps(
      "Stripe の消費税率を用意できませんでした",
      [
        `注文番号: ${orderRef}`,
        "",
        "決済は続行しています。この注文の Stripe の領収書には税率が載りません。",
        "Stripe の障害が無いか、秘密鍵に Tax Rate の権限があるかを確認してください。",
      ].join("\n"),
    );
  }
  const taxRates = taxRateId ? { tax_rates: [taxRateId] } : {};
  const lineItems = items.map((it) => ({
    quantity: it.qty,
    price_data: {
      currency: "jpy",
      unit_amount: it.unitPrice, // JPY は最小単位＝円。整数をそのまま渡す。
      product_data: { name: `${it.name} ${it.variant}（${it.ml}ml）` },
    },
    ...taxRates,
  }));
  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "jpy",
        unit_amount: shipping,
        product_data: { name: "配送料 / Shipping" },
      },
      ...taxRates,
    });
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail || undefined,
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
      // 決済ページの有効期限。既定の 24 時間のままだと、決済を放棄した注文が
      // まる 1 日ぶん在庫を押さえ続け、最後の 1 本が翌日まで買えなくなる。
      // Stripe が許す下限の 30 分にして、放棄分を早く解放する
      // （解放は checkout.session.expired の Webhook が行う）。
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SECONDS,
      // 注文の逆引きキー。Webhook はこれを使って確定する。
      metadata: { orderId: id, orderRef },
      payment_intent_data: {
        metadata: { orderId: id, orderRef },
        // Stripe の管理画面で注文番号から支払いを探すため。領収書には載らない。
        description: `ご注文 ${orderRef}`,
        // 指定すると、本番の決済が成功したときに Stripe が領収書を送る。
        ...(customerEmail ? { receipt_email: customerEmail } : {}),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      // 「戻る」で帰ってきたときは、期限切れを待たずにその場で在庫を解放する
      // （orderId を持たせて、その注文だけを対象にする）。ゲストは本人を確かめられない
      // ので、推測できない注文の id を「決済を始めたブラウザ」の鍵として持たせる。
      cancel_url: `${baseUrl}/cart?canceled=1&order=${orderRef}${userId ? "" : `&key=${id}`}`,
    });

    if (!checkout.url) {
      await deletePendingOrder(id);
      await releaseReservation(items);
      return { ok: false, error: "stripe" };
    }
    await rememberSession(id, checkout.id);
    return {
      ok: true,
      url: checkout.url,
      orderRef,
      ...(userId ? {} : { guestKey: id }),
    };
  } catch {
    // Stripe 失敗時は孤立した pending 注文を掃除し、押さえた在庫も戻す
    // （戻さないと、売れていないのに在庫だけ減ったままになる）。
    await deletePendingOrder(id);
    await releaseReservation(items);
    return { ok: false, error: "stripe" };
  }
}

/**
 * Stripe の決済ページを閉じる。閉じられたら、または期限が切れていたら true。
 * それ以外は支払いが進んでいる可能性があるので false。
 */
async function closeCheckoutSession(
  stripe: ReturnType<typeof getStripe>,
  sessionId: string,
): Promise<boolean> {
  try {
    await stripe.checkout.sessions.expire(sessionId);
    return true;
  } catch (err) {
    console.error("[checkout] 決済ページを閉じられませんでした:", err);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.status === "expired";
  }
}

/**
 * Session の id を注文に控える。「戻る」で帰ってきたときに決済ページを閉じるため。
 * 控えられなくても決済は止めない（その注文は期限切れの Webhook が片付ける）。
 */
async function rememberSession(orderId: string, sessionId: string): Promise<void> {
  try {
    const db = await getDb();
    await db
      .update(orderTable)
      .set({ stripeSessionId: sessionId })
      .where(eq(orderTable.id, orderId));
  } catch (err) {
    console.error("[checkout] Session の id を控えられませんでした:", err);
  }
}

/** 作りかけの pending 注文を消す。失敗しても致命的ではない（pending が残るだけ）。 */
async function deletePendingOrder(orderId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(orderTable).where(eq(orderTable.id, orderId));
  } catch (err) {
    console.error("[checkout] pending 注文の掃除に失敗:", err);
  }
}

/** 押さえた在庫を戻す。失敗してもここで決済を止めはしない（ログのみ）。 */
async function releaseReservation(items: OrderLine[]): Promise<void> {
  try {
    await releaseStock(items);
  } catch (err) {
    console.error("[checkout] 在庫引き当ての解放に失敗:", err);
  }
}

/**
 * 決済ページから「戻る」で帰ってきたときに、その注文の引き当てを解放する。
 *
 * ゲストの注文は `guestKey`（決済ページから戻る URL に付けた注文の id）が要る。
 * 本人を確かめられないので、注文番号だけでは消せないようにする。
 *
 * **消す前に Stripe の決済ページを閉じる。** Session は期限まで有効なので、開いたまま
 * 消すと、ブラウザの「戻る」から注文の無い支払いができてしまう。閉じられないときや
 * Session の id が無いときは、消さずに Webhook へ任せる。
 *
 * 期限切れ（30分）を待っても Webhook が解放するが、その間その在庫は誰も買えない。
 * 自分で引き返したと分かっているなら、待たずに戻したほうがよい。
 *
 * 安全性:
 * - **自分の pending 注文だけ**を対象にする（userId と status で絞る）。
 *   他人の引き当てを解放させられる経路にはしない。
 * - 冪等: 削除できた初回だけ解放する。連打しても在庫は二重に戻らない。
 * - 支払いが既に成立していれば status は pending でないので、何も起きない。
 */
export async function releaseAbandonedCheckoutAction(input: {
  orderRef: string;
  guestKey?: string;
}): Promise<{ ok: boolean }> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const guestKey =
    typeof input.guestKey === "string" ? input.guestKey : undefined;
  const owner = guestKey
    ? and(eq(orderTable.id, guestKey), isNull(orderTable.userId))
    : userId
      ? eq(orderTable.userId, userId)
      : null;
  if (!owner) return { ok: false };

  const ref = input.orderRef.trim();
  if (!ref) return { ok: false };

  const abandoned = and(
    eq(orderTable.orderRef, ref),
    owner,
    eq(orderTable.status, "pending"),
    // 確定後に手で pending へ戻した注文は入金済みなので消さない。
    eq(orderTable.stockState, "reserved"),
  );

  try {
    const db = await getDb();
    const [target] = await db
      .select({ stripeSessionId: orderTable.stripeSessionId })
      .from(orderTable)
      .where(abandoned)
      .limit(1);
    if (!target?.stripeSessionId) return { ok: false };

    const { env } = await getCloudflareContext({ async: true });
    const key = (env as StartCheckoutEnv).STRIPE_SECRET_KEY;
    if (!key) return { ok: false };
    const closed = await closeCheckoutSession(
      getStripe(key),
      target.stripeSessionId,
    );
    if (!closed) return { ok: false };

    const deleted = await db
      .delete(orderTable)
      .where(abandoned)
      .returning({
        orderRef: orderTable.orderRef,
        itemsJson: orderTable.itemsJson,
      });

    if (deleted.length === 0) return { ok: false };

    await applyStockMove(deleted[0], "reserved", "none");
    return { ok: true };
  } catch (err) {
    console.error("[checkout] 放棄された決済の解放に失敗:", err);
    return { ok: false };
  }
}
