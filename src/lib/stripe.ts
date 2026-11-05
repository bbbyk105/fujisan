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
