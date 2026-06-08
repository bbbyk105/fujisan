"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { getDb } from "@/db";
import {
  order as orderTable,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
} from "@/db/orders-schema";

type AdminOrderListItem = {
  id: string;
  userId: string;
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

async function requireStaff(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: u.id, email: u.email };
}

/**
 * 管理者向け: 全注文を新しい順で取得する。非 admin にはエラー（空配列ではなく明示）。
 */
export async function adminListOrdersAction(): Promise<
  | { ok: true; orders: AdminOrderListItem[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(orderTable)
      .orderBy(desc(orderTable.createdAt))
      .limit(200);

    const orders = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
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
    return { ok: true, orders };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 管理者向け: 1件の注文を更新する。
 * - status 変更時の補正:
 *   - shipped に進めた瞬間に shippedAt が未設定なら自動で「今」に
 *   - delivered に進めた瞬間に deliveredAt が未設定なら自動で「今」に
 * - 追跡情報は空文字を「クリア」として扱う
 *
 * 成功時は /admin/orders と /account をリバリデートして UI を最新化。
 */
export async function adminUpdateOrderAction(input: {
  orderId: string;
  status: OrderStatus;
  trackingCarrier?: string;
  trackingNumber?: string;
}): Promise<
  { ok: true } | { ok: false; error: "unauth" | "forbidden" | "invalid" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.orderId) return { ok: false, error: "invalid" };
  if (!ORDER_STATUSES.includes(input.status))
    return { ok: false, error: "invalid" };

  try {
    const db = await getDb();
    // 既存行をいちど読んで shippedAt / deliveredAt の自動補完を判断する
    const [current] = await db
      .select({
        shippedAt: orderTable.shippedAt,
        deliveredAt: orderTable.deliveredAt,
      })
      .from(orderTable)
      .where(eq(orderTable.id, input.orderId))
      .limit(1);

    if (!current) return { ok: false, error: "invalid" };

    const now = new Date();
    const carrier = (input.trackingCarrier ?? "").trim();
    const number = (input.trackingNumber ?? "").trim();

    await db
      .update(orderTable)
      .set({
        status: input.status,
        trackingCarrier: carrier ? carrier : null,
        trackingNumber: number ? number : null,
        shippedAt:
          input.status === "shipped" && !current.shippedAt
            ? now
            : current.shippedAt,
        deliveredAt:
          input.status === "delivered" && !current.deliveredAt
            ? now
            : current.deliveredAt,
      })
      .where(eq(orderTable.id, input.orderId));

    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
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
