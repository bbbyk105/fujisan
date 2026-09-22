"use server";

import { and, desc, gte, inArray, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { order as orderTable, type OrderStatus } from "@/db/orders-schema";
import { contactMessage } from "@/db/contact-schema";
import { tradeAccount } from "@/db/trade-schema";
import { requireAdmin } from "@/lib/admin";
import { getLiveSkus } from "@/lib/catalog";
import { jstDayStart, jstMonthStart } from "@/lib/format-date";

/**
 * 売上に計上するステータス。キャンセルと返金は除外する
 * （/admin/orders の集計と同じ規則）。
 */
const REVENUE_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

/** 蔵側の作業が残っている＝要対応のステータス。 */
const ACTION_STATUSES: OrderStatus[] = ["confirmed", "preparing"];

export type DashboardSummary = {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  allTime: { orders: number; revenue: number };
  /** 蔵側の発送作業が残っている注文数。 */
  actionRequired: number;
  /** お客様からのキャンセル依頼のうち、まだ処理していないもの。 */
  cancelRequests: number;
  /** 未読のお問い合わせ。 */
  newContacts: number;
  /** 審査待ちの取扱店。 */
  pendingTradeAccounts: number;
  /** 在庫僅少・完売の SKU。管理者が最初に見るべきアラート。 */
  lowStock: Array<{ id: string; label: string; available: number }>;
  soldOut: Array<{ id: string; label: string }>;
  recent: Array<{
    id: string;
    orderRef: string;
    status: OrderStatus;
    total: number;
    customerName: string;
    createdAt: Date;
  }>;
};

/**
 * 管理トップの集計（staff 以上）。
 *
 * 金額の合計は **SQL 側で行う**。件数が増えても取得上限に影響されず、
 * Worker のメモリにも載せないで済む。
 *
 * 期間の区切りは**日本時間**。Worker は UTC で動くので、UTC の 0:00 で
 * 切ると JST 09:00 で日が変わることになり、朝の売上が前日に混ざる。
 */
export async function adminDashboardAction(): Promise<
  | { ok: true; summary: DashboardSummary }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const now = new Date();

    const agg = {
      orders: sql<number>`count(*)`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${orderTable.total}), 0)`.mapWith(
        Number,
      ),
    };
    const count = { n: sql<number>`count(*)`.mapWith(Number) };
    const paidRevenue = inArray(orderTable.status, REVENUE_STATUSES);

    const [
      [allTime],
      [month],
      [today],
      [action],
      [cancels],
      [contacts],
      [trades],
      skus,
      recent,
    ] = await Promise.all([
      db.select(agg).from(orderTable).where(paidRevenue),
      db
        .select(agg)
        .from(orderTable)
        .where(and(paidRevenue, gte(orderTable.paidAt, jstMonthStart(now)))),
      db
        .select(agg)
        .from(orderTable)
        .where(and(paidRevenue, gte(orderTable.paidAt, jstDayStart(now)))),
      db
        .select(count)
        .from(orderTable)
        .where(inArray(orderTable.status, ACTION_STATUSES)),
      // キャンセル依頼のうち、まだ発送前で決着していないもの。
      // 既に cancelled / refunded になったものは処理済みなので数えない。
      db
        .select(count)
        .from(orderTable)
        .where(
          and(
            sql`${orderTable.cancelRequestedAt} is not null`,
            inArray(orderTable.status, ACTION_STATUSES),
          ),
        ),
      db
        .select(count)
        .from(contactMessage)
        .where(eq(contactMessage.status, "new")),
      db
        .select(count)
        .from(tradeAccount)
        .where(eq(tradeAccount.status, "pending")),
      getLiveSkus(),
      db
        .select({
          id: orderTable.id,
          orderRef: orderTable.orderRef,
          status: orderTable.status,
          total: orderTable.total,
          customerName: orderTable.customerName,
          createdAt: orderTable.createdAt,
        })
        .from(orderTable)
        .where(paidRevenue)
        .orderBy(desc(orderTable.createdAt))
        .limit(8),
    ]);

    const label = (s: { name: string; variant: string; ml: number }) =>
      `${s.name} ${s.variant} ${s.ml}ml`;

    return {
      ok: true,
      summary: {
        today: { orders: today.orders, revenue: today.revenue },
        month: { orders: month.orders, revenue: month.revenue },
        allTime: { orders: allTime.orders, revenue: allTime.revenue },
        actionRequired: action.n,
        cancelRequests: cancels.n,
        newContacts: contacts.n,
        pendingTradeAccounts: trades.n,
        // 在庫管理していない SKU は数量無制限なので、アラートには出さない。
        lowStock: skus
          .filter((s) => s.lowStock)
          .map((s) => ({
            id: `${s.slug}-${s.ml}`,
            label: label(s),
            available: s.available ?? 0,
          })),
        soldOut: skus
          .filter((s) => s.tracked && s.available === 0)
          .map((s) => ({ id: `${s.slug}-${s.ml}`, label: label(s) })),
        recent: recent.map((r) => ({ ...r, status: r.status as OrderStatus })),
      },
    };
  } catch {
    return { ok: false, error: "db" };
  }
}
