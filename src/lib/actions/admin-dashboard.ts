"use server";

import { and, desc, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { order as orderTable, type OrderStatus } from "@/db/orders-schema";
import { requireAdmin } from "@/lib/admin";
import { getLiveSkus } from "@/lib/catalog";

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

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 日本時間のその日 0:00 を UTC の Date で返す（Worker は UTC で動くため）。 */
function jstDayStart(now: Date): Date {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) -
      JST_OFFSET_MS,
  );
}

/** 日本時間のその月 1日 0:00 を UTC の Date で返す。 */
function jstMonthStart(now: Date): Date {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1) - JST_OFFSET_MS,
  );
}

export type DashboardSummary = {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  allTime: { orders: number; revenue: number };
  /** 蔵側の作業が残っている注文数。 */
  actionRequired: number;
  /** 在庫僅少・完売の SKU。管理者が最初に見るべきアラート。 */
  lowStock: Array<{ id: string; label: string; stockQty: number }>;
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
 * 金額の合計は SQL 側で行うため、注文が増えても取得件数の上限に影響されない。
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
    const paidRevenue = inArray(orderTable.status, REVENUE_STATUSES);

    const [[allTime], [month], [today], [action], skus, recent] =
      await Promise.all([
        db.select(agg).from(orderTable).where(paidRevenue),
        db
          .select(agg)
          .from(orderTable)
          .where(
            and(paidRevenue, gte(orderTable.paidAt, jstMonthStart(now))),
          ),
        db
          .select(agg)
          .from(orderTable)
          .where(and(paidRevenue, gte(orderTable.paidAt, jstDayStart(now)))),
        db
          .select({ orders: agg.orders })
          .from(orderTable)
          .where(inArray(orderTable.status, ACTION_STATUSES)),
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
          .where(inArray(orderTable.status, REVENUE_STATUSES))
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
        actionRequired: action.orders,
        lowStock: skus
          .filter((s) => s.lowStock)
          .map((s) => ({
            id: `${s.slug}-${s.ml}`,
            label: label(s),
            stockQty: s.stockQty ?? 0,
          })),
        soldOut: skus
          .filter((s) => s.soldOut)
          .map((s) => ({ id: `${s.slug}-${s.ml}`, label: label(s) })),
        recent: recent.map((r) => ({
          ...r,
          status: r.status as OrderStatus,
        })),
      },
    };
  } catch {
    return { ok: false, error: "db" };
  }
}
