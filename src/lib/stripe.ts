import Stripe from "stripe";

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
    appInfo: { name: "fujisan", url: "https://fujisan-sake.com" },
  });
  cached = { key: secretKey, client };
  return client;
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
