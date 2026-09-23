"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { alertOps } from "@/lib/ops-alert";
import { RECEIPT_ADDRESSEE_MAX } from "@/data/fujisan-orders";
import {
  order as orderTable,
  type OrderLine,
  type OrderStatus,
} from "@/db/orders-schema";

/** 顧客向け表示用にデコードされた注文行（itemsJson をパース済み）。 */
export type OrderRecord = {
  id: string;
  orderRef: string;
  status: OrderStatus;
  items: OrderLine[];
  itemsCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail: string;
  postalCode: string;
  address: string;
  phone: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  /** 支払いが確定した日時（Webhook が記録）。領収書の発行日に使う。 */
  paidAt: Date | null;
  /** お客様がキャンセルを依頼した日時。未依頼なら null。 */
  cancelRequestedAt: Date | null;
  /**
   * これまでに返金された累計額（円）。null は返金なし。
   * `status === "refunded"` は全額返金。一部返金はステータスに出ないので、
   * 画面では必ずこの金額も見る（見ないと「返金された」ことが伝わらない）。
   */
  refundedAmount: number | null;
  /** 直近の返金日時。 */
  refundedAt: Date | null;
  /** 領収書の宛名。null なら登録名（customerName）を使う。 */
  receiptAddressee: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ログイン中ユーザー自身の注文一覧を新しい順に取得する。
 * 失敗時は空配列を返す（UI 側は「注文なし」と区別不要のため）。
 */
export async function listMyOrdersAction(limit = 20): Promise<OrderRecord[]> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  try {
    const db = await getDb();
    // 未払いで放棄された pending（住所未取得・空）は表示しない。確定済み以降のみ。
    const rows = await db
      .select()
      .from(orderTable)
      .where(
        and(
          eq(orderTable.userId, session.user.id),
          ne(orderTable.status, "pending"),
        ),
      )
      .orderBy(desc(orderTable.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      orderRef: row.orderRef,
      status: row.status as OrderStatus,
      items: safeParseItems(row.itemsJson),
      itemsCount: row.itemsCount,
      subtotal: row.subtotal,
      shipping: row.shipping,
      total: row.total,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      postalCode: row.postalCode,
      address: row.address,
      phone: row.phone,
      trackingCarrier: row.trackingCarrier,
      trackingNumber: row.trackingNumber,
      shippedAt: row.shippedAt ?? null,
      deliveredAt: row.deliveredAt ?? null,
      paidAt: row.paidAt ?? null,
      cancelRequestedAt: row.cancelRequestedAt ?? null,
      refundedAmount: row.refundedAmount ?? null,
      refundedAt: row.refundedAt ?? null,
      receiptAddressee: row.receiptAddressee ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch {
    return [];
  }
}

/**
 * 注文番号で自分の注文を 1 件取得する。
 *
 * **必ず userId でも絞る**。注文番号は推測しにくいだけで秘密ではないため、
 * orderRef だけで引くと他人の注文が見えてしまう。
 * 未払いのまま放棄された pending は「注文」として扱わない（一覧と同じ規則）。
 */
export async function getMyOrderByRefAction(
  orderRef: string,
): Promise<OrderRecord | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const ref = orderRef.trim();
  if (!ref) return null;

  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(orderTable)
      .where(
        and(
          eq(orderTable.orderRef, ref),
          eq(orderTable.userId, session.user.id),
          ne(orderTable.status, "pending"),
        ),
      )
      .limit(1);
    if (!row) return null;

    return {
      id: row.id,
      orderRef: row.orderRef,
      status: row.status as OrderStatus,
      items: safeParseItems(row.itemsJson),
      itemsCount: row.itemsCount,
      subtotal: row.subtotal,
      shipping: row.shipping,
      total: row.total,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      postalCode: row.postalCode,
      address: row.address,
      phone: row.phone,
      trackingCarrier: row.trackingCarrier,
      trackingNumber: row.trackingNumber,
      shippedAt: row.shippedAt ?? null,
      deliveredAt: row.deliveredAt ?? null,
      paidAt: row.paidAt ?? null,
      cancelRequestedAt: row.cancelRequestedAt ?? null,
      refundedAmount: row.refundedAmount ?? null,
      refundedAt: row.refundedAt ?? null,
      receiptAddressee: row.receiptAddressee ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

/** 発送前＝キャンセル依頼を受け付けられるステータス。 */
const CANCELLABLE_STATUSES: OrderStatus[] = ["confirmed", "preparing"];

/**
 * お客様からのキャンセル依頼を記録する。
 *
 * **ここでは返金しない。** 返金は引き続き owner だけが
 * `adminRefundOrderAction` から実行する（お客様の操作でお金が動く経路は作らない）。
 * この関数は「依頼があった」事実を注文に刻み、管理者へ知らせるところまで。
 *
 * 発送後（shipped / delivered）は受け付けない。酒類は返品を受けられないため、
 * その場合はお問い合わせから個別に対応する。
 */
export async function requestOrderCancellationAction(input: {
  orderRef: string;
  reason?: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      error: "unauth" | "not_found" | "not_cancellable" | "already" | "db";
    }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user?.id) return { ok: false, error: "unauth" };

  const ref = input.orderRef.trim();
  if (!ref) return { ok: false, error: "not_found" };
  const reason = (input.reason ?? "").trim().slice(0, 500);

  let row;
  try {
    const db = await getDb();
    [row] = await db
      .select()
      .from(orderTable)
      .where(
        and(eq(orderTable.orderRef, ref), eq(orderTable.userId, user.id)),
      )
      .limit(1);
  } catch {
    return { ok: false, error: "db" };
  }
  if (!row) return { ok: false, error: "not_found" };
  if (!CANCELLABLE_STATUSES.includes(row.status as OrderStatus)) {
    return { ok: false, error: "not_cancellable" };
  }
  if (row.cancelRequestedAt) return { ok: false, error: "already" };

  try {
    const db = await getDb();
    // 冪等: まだ依頼が無い行だけを更新する（連打しても通知は 1 回）。
    const updated = await db
      .update(orderTable)
      .set({ cancelRequestedAt: new Date(), cancelReason: reason || null })
      .where(
        and(eq(orderTable.id, row.id), isNull(orderTable.cancelRequestedAt)),
      )
      .returning({ id: orderTable.id });
    if (updated.length === 0) return { ok: false, error: "already" };
  } catch {
    return { ok: false, error: "db" };
  }

  revalidatePath(`/account/orders/${ref}`);
  revalidatePath("/admin/orders");

  // 通知はベストエフォート。依頼自体は DB に残っており管理画面から拾える。
  try {
    await alertOps(
      "注文のキャンセル依頼が届きました",
      [
        `注文番号: ${row.orderRef}`,
        `お客様: ${row.customerName}（${row.customerEmail}）`,
        `現在のステータス: ${row.status}`,
        `金額: ¥${row.total.toLocaleString("ja-JP")}`,
        `理由: ${reason || "（記入なし）"}`,
        "",
        "発送を止めたうえで、管理画面から返金してください（返金は owner のみ実行できます）。",
      ].join("\n"),
    );
  } catch (err) {
    console.error("[orders] キャンセル依頼の通知に失敗:", err);
  }

  return { ok: true };
}

function safeParseItems(json: string): OrderLine[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as OrderLine[];
  } catch {
    return [];
  }
}

/**
 * 領収書の宛名を設定する（お客様ご自身）。
 *
 * 空文字を渡すと未指定に戻り、登録名が使われる。
 *
 * **必ず userId でも絞る。** orderRef は推測しにくいだけで秘密ではないので、
 * 番号だけで更新できると他人の領収書を書き換えられる。
 *
 * 金額・ステータスには一切触れない。宛名は「誰に宛てた書面か」を示すだけで、
 * 受け取った金額の事実は変わらない。
 */
export async function setReceiptAddresseeAction(input: {
  orderRef: string;
  addressee: string;
}): Promise<
  { ok: true; addressee: string | null } | { ok: false; error: "unauth" | "not_found" | "invalid" | "db" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unauth" };

  const ref = input.orderRef.trim();
  if (!ref) return { ok: false, error: "not_found" };

  const raw = input.addressee.trim();
  if (raw.length > RECEIPT_ADDRESSEE_MAX) return { ok: false, error: "invalid" };
  // 改行は書面の体裁を壊すので受け付けない。
  if (/[\r\n]/.test(raw)) return { ok: false, error: "invalid" };
  const value = raw === "" ? null : raw;

  try {
    const db = await getDb();
    const updated = await db
      .update(orderTable)
      .set({ receiptAddressee: value })
      .where(
        and(eq(orderTable.orderRef, ref), eq(orderTable.userId, userId)),
      )
      .returning({ id: orderTable.id });

    if (updated.length === 0) return { ok: false, error: "not_found" };

    revalidatePath(`/account/orders/${ref}/receipt`);
    return { ok: true, addressee: value };
  } catch {
    return { ok: false, error: "db" };
  }
}
