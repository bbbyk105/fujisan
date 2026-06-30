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

/**
 * 新規注文を登録する。ログイン中ユーザーが必須。
 * - 注文番号（orderRef）はサーバー側で発番（タイムスタンプ＋ランダム）
 * - status は "pending" で開始
 * - items は OrderLine[] を JSON 文字列として保存
 *
 * 戻り値: 作成成功時は `{ ok: true, orderRef }`、失敗時は `{ ok: false, error }`
 */
export async function createOrderAction(input: {
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
}): Promise<
  | { ok: true; orderRef: string }
  | { ok: false; error: "unauth" | "invalid" | "db" }
> {
  // 認証チェック（ゲスト注文は受け付けない方針）
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "unauth" };

  // 最小限の入力検証（カート空・金額不正・必須項目欠落をはじく）
  if (!input.items.length) return { ok: false, error: "invalid" };
  if (
    !Number.isFinite(input.total) ||
    !Number.isFinite(input.subtotal) ||
    input.total < 0
  ) {
    return { ok: false, error: "invalid" };
  }
  if (
    !input.customerName.trim() ||
    !input.customerEmail.trim() ||
    !input.postalCode.trim() ||
    !input.address.trim() ||
    !input.phone.trim()
  ) {
    return { ok: false, error: "invalid" };
  }

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    const orderRef = makeOrderRef();

    await db.insert(orderTable).values({
      id,
      userId: session.user.id,
      orderRef,
      status: "pending",
      itemsJson: JSON.stringify(input.items),
      itemsCount: input.itemsCount,
      subtotal: input.subtotal,
      shipping: input.shipping,
      total: input.total,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      postalCode: input.postalCode.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
    });

    return { ok: true, orderRef };
  } catch {
    return { ok: false, error: "db" };
  }
}

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

/** "FJ-LOQXXXXXX" 形式のヒューマンリーダブルな注文番号。 */
function makeOrderRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `FJ-${ts}${rand}`;
}
