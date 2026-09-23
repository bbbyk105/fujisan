import type Stripe from "stripe";
import { and, eq, isNull, lt, ne, or } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe, verifyStripeSignature } from "@/lib/stripe";
import { getDb } from "@/db";
import {
  order as orderTable,
  type OrderLine,
  type OrderStatus,
  hasLeftTheKura,
} from "@/db/orders-schema";
import {
  sendOrderConfirmedEmail,
  sendOrderRefundedEmail,
  type OrderEmailData,
} from "@/lib/emails/order-emails";
import { alertOps } from "@/lib/ops-alert";
import {
  commitStock,
  formatStockWarnings,
  releaseStock,
  restockCommitted,
} from "@/lib/inventory";
import { formatDateTimeJp } from "@/lib/format-date";

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

  switch (event.type) {
    // 同期決済（カード等）＝completed、非同期決済（コンビニ等）の後追い成功＝async_payment_succeeded
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
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
      break;
    }

    // 決済されないまま Session が期限切れ／後払いが失敗した。
    // pending のまま残しても誰にも見えず溜まり続けるだけなので掃除する。
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        await discardPendingOrder(session);
      } catch (err) {
        // 掃除に失敗しても入金には影響しない。再送を促すほどではないのでログのみ。
        console.error("[stripe:webhook] pending 注文の掃除に失敗:", err);
      }
      break;
    }

    // Stripe ダッシュボードから返金された場合、こちらの DB は何も知らない。
    // 管理画面の返金ボタン以外の経路で返金されても状態が揃うように同期する。
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      try {
        await syncRefundFromStripe(charge);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        // 返金済みなのに DB が confirmed のままだと二重返金の危険がある。再送させる。
        await alertOps(
          "Stripe Webhook で返金の同期に失敗",
          [
            `charge: ${charge.id}`,
            `paymentIntent: ${paymentIntentIdOf(charge.payment_intent)}`,
            `error: ${msg}`,
            "",
            "Stripe 側では返金が成立している可能性があります。D1 の orders と突き合わせてください。",
          ].join("\n"),
        );
        return new Response(`refund sync error: ${msg}`, { status: 500 });
      }
      break;
    }

    // チャージバック。期限内に証拠を提出しないと自動的に売上が引かれる。
    // 自動でできることは無いので、確実に人へ知らせることに徹する。
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      await alertOps(
        "チャージバックが申し立てられました",
        [
          `dispute: ${dispute.id}`,
          `charge: ${typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id}`,
          `金額: ¥${dispute.amount.toLocaleString("ja-JP")}`,
          `理由: ${dispute.reason}`,
          `ステータス: ${dispute.status}`,
          dispute.evidence_details?.due_by
            ? `証拠提出期限: ${formatDateTimeJp(new Date(dispute.evidence_details.due_by * 1000))}`
            : "証拠提出期限: 不明",
          "",
          "Stripe Dashboard から期限内に対応してください。放置すると売上が引き落とされます。",
        ].join("\n"),
      );
      break;
    }

    default:
      // 購読していないイベントは受領のみ（Stripe 側の設定変更で増えても落とさない）。
      break;
  }

  return Response.json({ received: true });
}

/** Stripe の payment_intent フィールド（文字列 or オブジェクト）から id を取り出す。 */
function paymentIntentIdOf(
  pi: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

/**
 * 未払いのまま終わった Session に対応する pending 注文を削除する。
 *
 * 冪等: `status='pending'` 付きの DELETE なので、確定済みの注文は決して消えない
 * （期限切れイベントが確定イベントより後に届いても安全）。
 */
async function discardPendingOrder(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return; // 当方が発行したセッションでなければ無視

  const db = await getDb();
  // 削除できた行だけ在庫を解放する。確定済み（pending でない）の注文は
  // WHERE に弾かれて 0 行となり、解放もされない — 期限切れイベントが
  // 確定イベントより後に届いても在庫が二重に戻ることはない。
  const deleted = await db
    .delete(orderTable)
    .where(and(eq(orderTable.id, orderId), eq(orderTable.status, "pending")))
    .returning({ itemsJson: orderTable.itemsJson });

  if (deleted.length === 0) return;
  await releaseStock(safeParseItems(deleted[0].itemsJson));
}

/**
 * Stripe 側で成立した返金を注文に反映する。
 *
 * ダッシュボードから直接返金された場合も、管理画面の返金ボタンから来た場合も、
 * 同じこの経路を通る。**全額・一部のどちらも DB に残す。**
 *
 * - 対象は PaymentIntent で引き当てる（管理画面経由なら保存済み）。
 * - `status` を `refunded` にするのは**全額返し切ったときだけ**。一部返金では
 *   ステータスを動かさない（その注文はまだ発送する予定のもの）。
 * - 冪等: 「これまでの累計より増えているときだけ」更新する。管理画面から
 *   返金した直後に同じ額の Webhook が来ても更新行ゼロとなり、
 *   累計の二重計上も返金メールの重複送信も起きない。
 */
async function syncRefundFromStripe(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = paymentIntentIdOf(charge.payment_intent);
  if (!paymentIntentId) return;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  if (!row) return; // 当方の注文に紐づかない charge は無視

  const refundedTotal = charge.amount_refunded;
  if (refundedTotal <= 0) return;
  // 全額返金かは**注文の総額**で判定する（charge の金額ではなく）。
  // 送料込みの total と charge.amount は一致する作りだが、判定の拠り所を
  // 注文側に置いておかないと、将来ずれたときに状態が食い違う。
  const isFullRefund = refundedTotal >= row.total;
  const refundId = charge.refunds?.data?.[0]?.id ?? null;

  const updated = await db
    .update(orderTable)
    .set({
      ...(isFullRefund ? { status: "refunded" as const } : {}),
      refundedAt: new Date(),
      refundedAmount: refundedTotal,
      // 既に控えがある場合は上書きしない（管理画面経由の返金 id を残す）。
      ...(refundId && !row.stripeRefundId ? { stripeRefundId: refundId } : {}),
    })
    .where(
      and(
        eq(orderTable.id, row.id),
        ne(orderTable.status, "refunded"),
        // 累計が増えるときだけ反映する。これが冪等性の要。
        or(
          isNull(orderTable.refundedAmount),
          lt(orderTable.refundedAmount, refundedTotal),
        ),
      ),
    )
    .returning({ id: orderTable.id });

  if (updated.length === 0) return; // 既に反映済み（管理画面から返金した等）

  if (isFullRefund) {
    // 未発送のまま全額返金したなら品物は蔵にあるので在庫に戻す。
    // 発送後（shipped / delivered）は手元に戻っていないので戻さない
    // （返品を受け取ったら /admin/products で手で足す）。
    if (!hasLeftTheKura(row.status as OrderStatus)) {
      try {
        await restockCommitted(safeParseItems(row.itemsJson));
      } catch (err) {
        console.error("[stripe:webhook] 返金に伴う在庫の戻しに失敗:", err);
      }
    }
  } else {
    // 一部返金では在庫を自動では戻さない — 金額からは、どの品を何本
    // 引き取ったのかが分からない。人が数えて入れる必要があるので知らせる。
    await alertOps(
      "一部返金が行われました（在庫の確認をお願いします）",
      [
        `注文番号: ${row.orderRef}`,
        `charge: ${charge.id}`,
        `返金累計: ¥${refundedTotal.toLocaleString("ja-JP")} / ¥${row.total.toLocaleString("ja-JP")}`,
        "",
        "注文は進行中のままです（発送は続きます）。",
        "品物を引き取った場合は /admin/products で在庫を足してください。",
      ].join("\n"),
    );
  }

  // 返金メールはベストエフォート。返金自体は Stripe 側で成立している。
  try {
    await sendOrderRefundedEmail({
      orderRef: row.orderRef,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      items: safeParseItems(row.itemsJson),
      itemsCount: row.itemsCount,
      subtotal: row.subtotal,
      shipping: row.shipping,
      total: row.total,
      postalCode: row.postalCode,
      address: row.address,
      // 今回の Webhook で分かるのは**累計**。直前の累計との差分を出すことも
      // できるが、ダッシュボード返金では控えが無い場合もあるため累計を出す。
      refundAmount: refundedTotal,
      partial: !isFullRefund,
    });
  } catch (err) {
    console.error("[stripe:webhook] 返金メール送信に失敗:", err);
  }
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

  // Stripe が収集したお届け先を取得（最新の完全な状態を取りに行く）。
  // 登録住所を使った注文では Stripe は住所を収集しない（ship = null）ため、
  // pending 時点で書き込まれた注文行の値を必ずフォールバックとして残す。
  const full = await stripe.checkout.sessions.retrieve(session.id);
  const ship = full.collected_information?.shipping_details;
  const cust = full.customer_details;
  const addr = ship?.address ?? null;
  const customerName = (ship?.name || cust?.name || row.customerName || "").trim();
  const customerEmail = (cust?.email || row.customerEmail || "").trim();
  const phone = (cust?.phone || row.phone || "").trim();
  const postalCode = (addr?.postal_code || row.postalCode || "").trim();
  const address = formatJpAddress(addr) || row.address;

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

  // 押さえていた在庫を確定する（reserved → onHand から差し引き）。
  // commitStock は冪等ではないので、**実際に pending → confirmed へ
  // 更新できた初回だけ**呼ぶこと（この位置より上で return していると二重に減る）。
  // 在庫の反映に失敗しても入金は成立しているので、例外で 500 にせず記録に留める。
  try {
    const warnings = await commitStock(safeParseItems(row.itemsJson));
    // 在庫がしきい値をまたいだら知らせる。commitStock はこの配信が初回のときしか
    // 呼ばれないので、同じ注文で二重に通知されることはない。
    await notifyStockWarnings(warnings);
  } catch (err) {
    console.error("[stripe:webhook] 在庫の確定に失敗:", err);
    await alertOps(
      "入金は確定したが在庫を減らせませんでした",
      [
        `注文番号: ${row.orderRef}`,
        `error: ${err instanceof Error ? err.message : "unknown"}`,
        "",
        "/admin/products で実在庫を突き合わせてください。",
      ].join("\n"),
    );
  }

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

/**
 * 在庫の警告を運用へ流す。**送信の失敗で決済処理を止めない。**
 * 入金は既に成立しており、通知が届かないことより 500 を返して
 * Stripe に再送させるほうが害が大きい。
 */
async function notifyStockWarnings(
  warnings: Awaited<ReturnType<typeof commitStock>>,
): Promise<void> {
  const message = formatStockWarnings(warnings);
  if (!message) return;
  try {
    await alertOps(message.subject, message.body);
  } catch (err) {
    console.error("[stripe:webhook] 在庫警告の通知に失敗:", err);
  }
}
