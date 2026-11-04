import Stripe from "stripe";
import { SITE_URL } from "@/lib/seo";

/**
 * Cloudflare Workers 上で動く Stripe クライアント。
 *
 * - Workers には Node の標準 http モジュールが無いため、HTTP クライアントを
 *   fetch ベース（`createFetchHttpClient`）に差し替える。
 * - 署名検証（Webhook）は `createSubtleCryptoProvider()` を使って Web Crypto で
 *   行う（→ `verifyStripeSignature` 参照）。Node crypto には依存しない。
 *
 * Worker 生存中はインスタンスをキャッシュする（秘密鍵が変わらない前提）。
 */
let cached: { key: string; client: Stripe } | null = null;

export function getStripe(secretKey: string): Stripe {
  if (cached && cached.key === secretKey) return cached.client;
  const client = new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
    // 一時的なネットワーク不調はSDK側でリトライ（決済セッション生成の取りこぼし防止）
    maxNetworkRetries: 2,
    appInfo: { name: "fujisan", url: SITE_URL },
  });
  cached = { key: secretKey, client };
  return client;
}

/** 税率の問い合わせは必須ではないので、遅いときは待たずに諦める。 */
const TAX_RATE_REQUEST = { timeout: 3000, maxNetworkRetries: 0 };

/**
 * 消費税 10%（内税）の Tax Rate の id を返す。無ければ作る。
 *
 * 領収書は Stripe が出すので、Checkout の行に税率を渡さないと領収書に載らない。
 * 内税なので請求額は変わらない。酒類は軽減税率の対象外で、送料も 10%。
 *
 * **id を環境変数で持たず、メモリにも残さない。** sandbox と本番で id が違い、
 * 本番キーへ切り替えたときに古い id が残ると全ての決済が止まる。アカウントは
 * 天地星空と共用で、ダッシュボードからアーカイブされた場合も同じことが起きる。
 *
 * 失敗したら `null`。領収書の税率のために決済を止めない（呼び出し側が人に知らせる）。
 */
export async function getConsumptionTaxRateId(
  stripe: Stripe,
): Promise<string | null> {
  try {
    const { data } = await stripe.taxRates.list(
      { active: true, inclusive: true, limit: 100 },
      TAX_RATE_REQUEST,
    );
    const existing = data.find((r) => r.percentage === 10 && r.country === "JP");
    if (existing) return existing.id;

    const created = await stripe.taxRates.create(
      {
        display_name: "消費税",
        percentage: 10,
        inclusive: true,
        country: "JP",
        tax_type: "jct",
      },
      TAX_RATE_REQUEST,
    );
    return created.id;
  } catch (err) {
    console.error("[stripe] 消費税の Tax Rate を用意できませんでした:", err);
    return null;
  }
}

/**
 * 支払いの領収書のリンクを Stripe から取得する。無ければ `null`。
 *
 * リンクは 30 日で切れるので保存しない。見せるたびにここで取り直す。
 * Webhook を取りこぼして管理画面で確定した注文は PaymentIntent の記録が無いので、
 * Checkout Session から引き直す。
 *
 * 支払いが見つからないのは `null`（本番キーへ切り替えたあとの sandbox の注文など、
 * 再試行しても直らない）。Stripe の障害は投げる。
 */
export async function getReceiptUrl(
  stripe: Stripe,
  payment: { paymentIntentId: string | null; sessionId: string | null },
): Promise<string | null> {
  try {
    let paymentIntentId = payment.paymentIntentId;
    if (!paymentIntentId && payment.sessionId) {
      const session = await stripe.checkout.sessions.retrieve(payment.sessionId);
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);
    }
    if (!paymentIntentId) return null;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = paymentIntent.latest_charge;
    return typeof charge === "object" && charge
      ? (charge.receipt_url ?? null)
      : null;
  } catch (err) {
    if ((err as { code?: string }).code === "resource_missing") return null;
    throw err;
  }
}

/**
 * Webhook 署名を Web Crypto で検証して Stripe イベントを復元する。
 * 署名が不正・期限切れなら例外を投げる（呼び出し側で 400 を返す）。
 *
 * @param payload  リクエストの「生」ボディ文字列（JSON パース前）
 * @param signature `stripe-signature` ヘッダの値
 */
export async function verifyStripeSignature(
  stripe: Stripe,
  payload: string,
  signature: string,
  webhookSecret: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(
    payload,
    signature,
    webhookSecret,
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
}
