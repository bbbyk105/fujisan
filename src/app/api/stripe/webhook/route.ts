import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe, verifyStripeSignature } from "@/lib/stripe";
import { getDb } from "@/db";
import { order as orderTable, type OrderLine } from "@/db/orders-schema";
import {
  sendOrderConfirmedEmail,
  type OrderEmailData,
} from "@/lib/emails/order-emails";
import { alertOps } from "@/lib/ops-alert";

// 署名検証のため生ボディを読む。プリレンダ・キャッシュは一切しない。
export const dynamic = "force-dynamic";

type WebhookEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

/**
 * Stripe Webhook 受信口。支払い完了を「正」として注文を確定し、確定メールを送る。
 *
 * 成功画面のリダイレクトは取りこぼし得る（ユーザーがタブを閉じる等）ため、
 * 在庫確定・メール送信はすべてここで行う。Stripe は失敗時に自動再送する。
 */
export async function POST(request: Request): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as WebhookEnv;
  if (!e.STRIPE_SECRET_KEY || !e.STRIPE_WEBHOOK_SECRET) {
    return new Response("stripe not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  // 生ボディ。絶対に JSON パースしない（パースすると署名が一致しなくなる）。
  const body = await request.text();
  const stripe = getStripe(e.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = await verifyStripeSignature(
      stripe,
      body,
      signature,
      e.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(`signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  // 同期決済（カード等）＝completed、非同期決済（コンビニ等）の後追い成功＝async_payment_succeeded
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await fulfillOrder(stripe, session);
    } catch (err) {
      // 確定（DB 更新）で落ちた場合のみ 500 を返す → Stripe が再送（冪等なので二重確定なし）。
      const msg = err instanceof Error ? err.message : "unknown";
      // 入金済みなのに注文確定できていない＝人が気づくべき事象。管理者へアラート。
      // アラート自体の失敗で Webhook を落とさないよう内部で握りつぶす（alertOps はベストエフォート）。
      await alertOps(
        "Stripe Webhook で注文確定に失敗",
        [
          `event: ${event.type}`,
          `session: ${session.id}`,
          `orderId: ${session.metadata?.orderId ?? "(なし)"}`,
          `orderRef: ${session.metadata?.orderRef ?? "(なし)"}`,
          `error: ${msg}`,
          "",
          "入金は成立している可能性があります。Stripe Dashboard と D1 の orders を確認してください（Stripe は自動再送します）。",
        ].join("\n"),
      );
      return new Response(`fulfillment error: ${msg}`, { status: 500 });
    }
  }

  return Response.json({ received: true });
}

/**
 * 注文を確定する。冪等：pending の行だけを confirmed に更新し、
 * 実際に更新できた（＝この配信が初回）ときだけ確定メールを送る。
 *
 * お届け先（氏名・住所・郵便番号・電話・メール）は Stripe の決済ページで収集された
 * ものを取得して注文に書き戻す（pending 時点では空で作られている）。
 */
async function fulfillOrder(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  // 未払いセッションは確定しない（コンビニ等は別イベントで後追い）
  if (session.payment_status !== "paid") return;

  const orderId = session.metadata?.orderId;
  if (!orderId) return; // 当方が発行したセッションでなければ無視

  const db = await getDb();
  const [row] = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.id, orderId))
    .limit(1);
  if (!row) return; // 注文が見つからない → 受領のみ

  // Stripe が収集したお届け先を取得（最新の完全な状態を取りに行く）
  const full = await stripe.checkout.sessions.retrieve(session.id);
  const ship = full.collected_information?.shipping_details;
  const cust = full.customer_details;
  const addr = ship?.address ?? cust?.address ?? null;
  const customerName = (ship?.name || cust?.name || row.customerName || "").trim();
  const customerEmail = (cust?.email || row.customerEmail || "").trim();
  const phone = (cust?.phone || "").trim();
  const postalCode = (addr?.postal_code || "").trim();
  const address = formatJpAddress(addr);

  // 返金に使う PaymentIntent id を保存しておく（後で Session を引き直さずに返金できる）。
  const paymentIntentId =
    typeof full.payment_intent === "string"
      ? full.payment_intent
      : (full.payment_intent?.id ?? null);

  // pending → confirmed を原子的に。住所等もこの時点で書き戻す。
  // 更新行が無ければ既に他の配信が確定済み。
  const updated = await db
    .update(orderTable)
    .set({
      status: "confirmed",
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
      customerName,
      customerEmail,
      postalCode,
      address,
      phone,
    })
    .where(and(eq(orderTable.id, orderId), eq(orderTable.status, "pending")))
    .returning({ id: orderTable.id });

  if (updated.length === 0) return; // 二重配信 → 確定もメールもしない

  const data: OrderEmailData = {
    orderRef: row.orderRef,
    customerName,
    customerEmail,
    items: safeParseItems(row.itemsJson),
    itemsCount: row.itemsCount,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    postalCode,
    address,
  };

  // メール失敗で Webhook を 500 にすると、再送時は更新行ゼロでメールが二度と飛ばない。
  // 注文確定（入金記録）は済んでいるので、メールはベストエフォートにしてログのみ残す。
  try {
    await sendOrderConfirmedEmail(data);
  } catch (err) {
    console.error("[stripe:webhook] 確定メール送信に失敗:", err);
  }
}

/** Stripe の Address を日本語の1行住所に整形する（都道府県＋市区町村＋番地＋建物）。 */
function formatJpAddress(addr: Stripe.Address | null | undefined): string {
  if (!addr) return "";
  const base = `${addr.state ?? ""}${addr.city ?? ""}${addr.line1 ?? ""}`;
  return (addr.line2 ? `${base} ${addr.line2}` : base).trim();
}

function safeParseItems(json: string): OrderLine[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as OrderLine[]) : [];
  } catch {
    return [];
  }
}
