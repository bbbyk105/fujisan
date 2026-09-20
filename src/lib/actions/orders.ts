"use server";

import { headers } from "next/headers";
import { and, desc, eq, ne } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch {
    return [];
  }
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
