import type Stripe from "stripe";
import { and, eq, isNull, ne } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe, verifyStripeSignature } from "@/lib/stripe";
import { getDb } from "@/db";
import {
  order as orderTable,
  parseOrderItems,
  stockStateFor,
  willStillShip,
} from "@/db/orders-schema";
import {
  sendOrderConfirmedEmail,
  sendOrderRefundedEmail,
  type OrderEmailData,
} from "@/lib/emails/order-emails";
import { alertOps } from "@/lib/ops-alert";
import { SHIPPING_REGIONS } from "@/data/fujisan-legal";
import { isShippingRegion, shippingRegionNeedsReview } from "@/lib/cart/cart-core";
import { applyStockMove } from "@/lib/order-stock";
import { formatDateTimeJp } from "@/lib/format-date";
import { orderStatusJp } from "@/data/fujisan-orders";

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
        await syncRefundFromStripe(stripe, charge);
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
  // 確定後に手で pending へ戻した注文は入金済みなので、引き当て中の条件で除く。
  const deleted = await db
    .delete(orderTable)
    .where(
      and(
        eq(orderTable.id, orderId),
        eq(orderTable.status, "pending"),
        eq(orderTable.stockState, "reserved"),
      ),
    )
    .returning({
      orderRef: orderTable.orderRef,
      itemsJson: orderTable.itemsJson,
    });

  if (deleted.length === 0) return;
  await applyStockMove(deleted[0], "reserved", "none");
}

/** 返金の累計の更新を試す回数。同時に届いた配信に先を越されたら読み直す。 */
const REFUND_SYNC_ATTEMPTS = 3;

/**
 * Charge の最新の返金 id。Webhook の `charge.refunds` は expand されないので引き直す。
 * 控えの id が無くても返金の反映は止めない。
 */
async function latestRefundIdOf(
  stripe: Stripe,
  chargeId: string,
): Promise<string | null> {
  try {
    const refunds = await stripe.refunds.list(
      { charge: chargeId, limit: 1 },
      { timeout: 3000, maxNetworkRetries: 0 },
    );
    return refunds.data[0]?.id ?? null;
  } catch (err) {
    console.error("[stripe:webhook] 返金 id の取得に失敗:", err);
    return null;
  }
}

/**
 * 返金の累計を注文に記録する。この配信で累計を進められたら、記録する直前の行を返す。
 * 反映済み、または当方の注文でなければ null。
 *
 * 冪等性の要は「読んだときの累計」を WHERE に入れた UPDATE。管理画面から返金した直後に
 * 同じ額の Webhook が来ても更新しないので、累計の二重計上も返金メールの重複も起きない。
 * 別の配信に先を越されたら読み直す — そうしないと、今回の額を読み違えたままメールを送る。
 */
async function recordRefund(
  stripe: Stripe,
  charge: Stripe.Charge,
  paymentIntentId: string,
) {
  const db = await getDb();
  const refundedTotal = charge.amount_refunded;
  let latestRefundId: string | null | undefined;

  for (let attempt = 0; attempt < REFUND_SYNC_ATTEMPTS; attempt += 1) {
    const [row] = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.stripePaymentIntentId, paymentIntentId))
      .limit(1);
    if (!row) return null; // 当方の注文に紐づかない charge は無視
    if (row.status === "refunded" || (row.refundedAmount ?? 0) >= refundedTotal) {
      return null; // 既に反映済み（管理画面から返金した等）
    }

    // 既に控えがある場合は上書きしない（管理画面経由の返金 id を残す）。
    // やり直しのたびに問い合わせると、競合しているあいだ待ち時間が延びるので 1 回で済ませる。
    if (!row.stripeRefundId && latestRefundId === undefined) {
      latestRefundId = await latestRefundIdOf(stripe, charge.id);
    }
    const refundId = row.stripeRefundId ? null : latestRefundId;

    const updated = await db
      .update(orderTable)
      .set({
        // 全額かは**注文の総額**で判定する（charge の金額ではなく）。送料込みの total と
        // charge.amount は一致する作りだが、判定の拠り所を注文側に置いておかないと、
        // 将来ずれたときに状態が食い違う。
        ...(refundedTotal >= row.total
          ? {
              status: "refunded" as const,
              stockState: stockStateFor("refunded", row.stockState),
            }
          : {}),
        refundedAt: new Date(),
        refundedAmount: refundedTotal,
        ...(refundId ? { stripeRefundId: refundId } : {}),
      })
      .where(
        and(
          eq(orderTable.id, row.id),
          ne(orderTable.status, "refunded"),
          eq(orderTable.stockState, row.stockState),
          row.refundedAmount == null
            ? isNull(orderTable.refundedAmount)
            : eq(orderTable.refundedAmount, row.refundedAmount),
        ),
      )
      .returning({ id: orderTable.id });

    if (updated.length > 0) return row;
  }

  // 反映できていないので 500 にして Stripe に再送させる（累計は Stripe 側が正）。
  throw new Error("返金の累計を更新できませんでした");
}

/**
 * Stripe 側で成立した返金を注文に反映する。
 *
 * ダッシュボードから直接返金された場合も、管理画面の返金ボタンから来た場合も、
 * 同じこの経路を通る。**全額・一部のどちらも DB に残す。**
 *
 * - 対象は PaymentIntent で引き当てる（管理画面経由なら保存済み）。
 * - `status` を `refunded` にするのは**全額返し切ったときだけ**。一部返金では
 *   ステータスを動かさない（一部返金は発送の前にも後にも起き、取引は続く）。
 */
async function syncRefundFromStripe(
  stripe: Stripe,
  charge: Stripe.Charge,
): Promise<void> {
  const paymentIntentId = paymentIntentIdOf(charge.payment_intent);
  if (!paymentIntentId) return;

  const refundedTotal = charge.amount_refunded;
  if (refundedTotal <= 0) return;

  const row = await recordRefund(stripe, charge, paymentIntentId);
  if (!row) return;

  const isFullRefund = refundedTotal >= row.total;
  const stillShipping = willStillShip(row);

  if (isFullRefund) {
    // 蔵にある分だけ戻る。発送後は手元に無いので戻らない（返品を受け取ったら
    // /admin/products で手で足す）。戻し終えた注文は状態が none なので動かない。
    await applyStockMove(
      row,
      row.stockState,
      stockStateFor("refunded", row.stockState),
    );
  } else {
    // 一部返金では在庫を自動では戻さない — 金額からは、どの品を何本
    // 引き取ったのかが分からない。人が数えて入れる必要があるので知らせる。
    // 在庫を戻してある注文に足す案内を出すと二重になる。発送後に取り消した注文は
    // 戻していないので、status ではなく在庫の状態で見る。
    const restocked = row.stockState === "none";
    await alertOps(
      row.status === "cancelled"
        ? "取り消した注文に一部返金が行われました"
        : "一部返金が行われました（在庫の確認をお願いします）",
      [
        `注文番号: ${row.orderRef}`,
        `charge: ${charge.id}`,
        `返金累計: ¥${refundedTotal.toLocaleString("ja-JP")} / ¥${row.total.toLocaleString("ja-JP")}`,
        "",
        stillShipping
          ? "注文は進行中のままです（発送は続きます）。"
          : "ステータスは変わりません（これから発送する注文ではありません）。",
        restocked
          ? "取り消しのときに在庫は戻してあります。"
          : "品物を引き取った場合は /admin/products で在庫を足してください。",
      ].join("\n"),
    );
  }

  // 返金メールはベストエフォート。返金自体は Stripe 側で成立している。
  try {
    await sendOrderRefundedEmail({
      noAccount: row.userId === null,
      stillShipping,
      orderRef: row.orderRef,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      items: parseOrderItems(row.itemsJson),
      itemsCount: row.itemsCount,
      subtotal: row.subtotal,
      shipping: row.shipping,
      total: row.total,
      postalCode: row.postalCode,
      address: row.address,
      // Webhook で分かるのは累計なので、直前の累計との差分が今回の額になる。
      refundAmount: refundedTotal - (row.refundedAmount ?? 0),
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
  if (!row) {
    await alertPaymentWithoutOrder(session);
    return;
  }

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
  const stockTarget = stockStateFor("confirmed", row.stockState);
  const updated = await db
    .update(orderTable)
    .set({
      status: "confirmed",
      stockState: stockTarget,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
      customerName,
      customerEmail,
      postalCode,
      address,
      phone,
    })
    .where(
      and(
        eq(orderTable.id, orderId),
        eq(orderTable.status, "pending"),
        eq(orderTable.stockState, row.stockState),
      ),
    )
    .returning({ id: orderTable.id });

  if (updated.length === 0) {
    // 二重配信なら何もしない。確定を通らなかった入金だけは記録して人へ知らせる。
    await recordLatePayment(session, row, paymentIntentId, {
      customerName,
      customerEmail,
      postalCode,
      address,
      phone,
    });
    return;
  }

  // 押さえていた在庫を確定する。失敗しても入金は成立しているので、500 にせず
  // 運用へ知らせる（applyStockMove が行う）。
  await applyStockMove(row, row.stockState, stockTarget);

  // 住所で送料を変えられないので、カートで選んだ地域と合わなければ人が確かめる。
  const shippingRegion = session.metadata?.shippingRegion;
  if (
    isShippingRegion(shippingRegion) &&
    shippingRegionNeedsReview(shippingRegion, postalCode)
  ) {
    await alertOps(
      "お届け地域と住所を確認してほしい注文があります",
      [
        `注文番号: ${row.orderRef}`,
        `カートで選んだ地域: ${SHIPPING_REGIONS[shippingRegion].ja}`,
        `お届け先: 〒${postalCode} ${address}`,
        `受け取った送料: ¥${row.shipping.toLocaleString("ja-JP")}`,
        "",
        "発送前に、離島かどうかと送料の過不足を確かめ、必要ならお客様へ連絡してください。",
      ].join("\n"),
    );
  }

  const data: OrderEmailData = {
    noAccount: row.userId === null,
    orderRef: row.orderRef,
    customerName,
    customerEmail,
    items: parseOrderItems(row.itemsJson),
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
    // ゲストには注文を見るページが無く、このメールが唯一の記録になる。
    if (data.noAccount) {
      await alertOps(
        "アカウントの無いお客様へ確定メールを送れませんでした",
        [
          `注文番号: ${row.orderRef}`,
          `宛先: ${customerEmail}`,
          "",
          "入金は確定しています。お客様は注文番号を確認できないので、個別にご連絡ください。",
        ].join("\n"),
      );
    }
  }
}

/**
 * 注文が無いのに入金があったことを知らせる。「戻る」の解放は決済ページを閉じてから
 * 注文を消すので、通常は起こらない。手で注文を消した場合や、閉じる処理と支払いが
 * 重なった場合に備える。お金だけ受け取っているので、人が返金する。
 */
async function alertPaymentWithoutOrder(
  session: Stripe.Checkout.Session,
): Promise<void> {
  await alertOps(
    "注文が見つからない入金がありました",
    [
      `session: ${session.id}`,
      `orderId: ${session.metadata?.orderId ?? "(なし)"}`,
      `orderRef: ${session.metadata?.orderRef ?? "(なし)"}`,
      "",
      "注文は残っていません。Stripe の管理画面で支払いを確認し、返金してください。",
    ].join("\n"),
  );
}

/**
 * 確定（pending → confirmed）を通らなかった入金を記録する。コンビニ払いの支払い待ちの
 * 注文や、決済ページが開いたままの注文を手で動かすと起こる。
 *
 * ステータスは変えない（取り消しは人の判断なので、発送するかも人が決める）。入金日と
 * PaymentIntent を残せば、管理画面から返金でき、Webhook の返金の同期も注文を引ける。
 * WHERE に `paid_at IS NULL` を入れてあるので、二重配信では何も起きず、重ねて知らせない。
 */
async function recordLatePayment(
  session: Stripe.Checkout.Session,
  row: { id: string; orderRef: string },
  paymentIntentId: string | null,
  shipping: {
    customerName: string;
    customerEmail: string;
    postalCode: string;
    address: string;
    phone: string;
  },
): Promise<void> {
  const db = await getDb();
  const [recorded] = await db
    .update(orderTable)
    .set({
      ...shipping,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
    })
    .where(and(eq(orderTable.id, row.id), isNull(orderTable.paidAt)))
    .returning({ status: orderTable.status });

  if (recorded) {
    await alertOps(
      "確定していない注文に入金がありました",
      [
        `注文番号: ${row.orderRef}`,
        `ステータス: ${orderStatusJp(recorded.status)}`,
        `paymentIntent: ${paymentIntentId ?? "(不明)"}`,
        "",
        "ステータスは変えていません。/admin/orders で確認し、返金するか発送するかを決めてください。",
      ].join("\n"),
    );
    return;
  }

  // 読んだあとに注文が消えていたら、ここで知らせないと入金に誰も気づけない。
  const [stillThere] = await db
    .select({ id: orderTable.id })
    .from(orderTable)
    .where(eq(orderTable.id, row.id))
    .limit(1);
  if (!stillThere) await alertPaymentWithoutOrder(session);
}

/** Stripe の Address を日本語の1行住所に整形する（都道府県＋市区町村＋番地＋建物）。 */
function formatJpAddress(addr: Stripe.Address | null | undefined): string {
  if (!addr) return "";
  const base = `${addr.state ?? ""}${addr.city ?? ""}${addr.line1 ?? ""}`;
  return (addr.line2 ? `${base} ${addr.line2}` : base).trim();
}
