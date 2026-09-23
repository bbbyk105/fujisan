"use server";

import { headers } from "next/headers";
import { and, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { tradeAccount } from "@/db/trade-schema";
import { order as orderTable, type OrderStatus } from "@/db/orders-schema";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import type {
  TradeBusinessType,
  TradeStatus,
} from "@/data/fujisan-trade";

/**
 * 売上に数えるステータス。キャンセル・返金は除く
 * （/admin のダッシュボードと同じ規則。ここだけ違うと数字が合わない）。
 */
const REVENUE_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export type BusinessAccount = {
  id: string;
  contactName: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  createdAt: Date;
  /**
   * 審査状態。**行が無い（= この機能より前に登録した）法人は null** で、
   * 未承認として扱う。承認すると行ができる。
   */
  tradeStatus: TradeStatus | null;
  businessType: TradeBusinessType | null;
  licenceNumber: string | null;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  reviewNote: string | null;
};

async function requireStaff(): Promise<
  { ok: true } | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true };
}

/**
 * 法人（取扱店）アカウント一覧。staff 以上が閲覧できる。
 * role = "business" の登録会社情報を一覧する。
 */
export async function adminListBusinessAccountsAction(input?: {
  q?: string;
}): Promise<
  | { ok: true; accounts: BusinessAccount[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const q = (input?.q ?? "").trim();
    const where = and(
      eq(userTable.role, "business"),
      q
        ? or(
            like(userTable.companyName, `%${q}%`),
            like(userTable.name, `%${q}%`),
            like(userTable.email, `%${q}%`),
          )
        : undefined,
    );

    const rows = await db
      .select({
        id: userTable.id,
        contactName: userTable.name,
        email: userTable.email,
        companyName: userTable.companyName,
        phone: userTable.phone,
        address: userTable.address,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
        tradeStatus: tradeAccount.status,
        businessType: tradeAccount.businessType,
        licenceNumber: tradeAccount.licenceNumber,
        reviewedAt: tradeAccount.reviewedAt,
        reviewedByEmail: tradeAccount.reviewedByEmail,
        reviewNote: tradeAccount.reviewNote,
      })
      .from(userTable)
      // 申請行が無い法人も一覧から落とさない（承認して初めて行ができる）。
      .leftJoin(tradeAccount, eq(tradeAccount.userId, userTable.id))
      .where(where)
      .orderBy(desc(userTable.createdAt))
      .limit(300);

    return {
      ok: true,
      accounts: rows.map((row) => ({
        ...row,
        tradeStatus: (row.tradeStatus as TradeStatus | null) ?? null,
        businessType: (row.businessType as TradeBusinessType | null) ?? null,
        reviewedAt: row.reviewedAt ?? null,
      })),
    };
  } catch {
    return { ok: false, error: "db" };
  }
}

/** 個人のお客様 1 名。注文の実績を添える。 */
export type PersonalCustomer = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  postalCode: string | null;
  address: string | null;
  createdAt: Date;
  /** 売上に計上した注文の件数。 */
  orderCount: number;
  /** 同じく、その合計金額（円）。 */
  totalSpent: number;
  /** 直近の注文日時。無ければ null。 */
  lastOrderedAt: Date | null;
};

/**
 * 個人のお客様の一覧（staff 以上）。
 *
 * `/admin/customers` は取扱店（法人）しか出しておらず、「誰が買ってくれて
 * いるのか」を管理画面から一切たどれなかった。
 *
 * 集計は **SQL 側で行う**（注文を全部取ってきて JS で畳むと、件数が増えたときに
 * Worker のメモリと CPU をそのまま食う）。キャンセル・返金は売上に数えない
 * ので、ダッシュボードの集計と同じ規則で揃える。
 */
export async function adminListPersonalCustomersAction(input?: {
  q?: string;
}): Promise<
  | { ok: true; customers: PersonalCustomer[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const q = (input?.q ?? "").trim();

    // 注文の集計（売上に数えるステータスだけ）。
    const stats = db
      .select({
        userId: orderTable.userId,
        orderCount: sql<number>`count(*)`.as("order_count"),
        totalSpent: sql<number>`coalesce(sum(${orderTable.total}), 0)`.as(
          "total_spent",
        ),
        lastOrderedAt: sql<number>`max(${orderTable.createdAt})`.as(
          "last_ordered_at",
        ),
      })
      .from(orderTable)
      .where(inArray(orderTable.status, REVENUE_STATUSES))
      .groupBy(orderTable.userId)
      .as("stats");

    const rows = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        phone: userTable.phone,
        postalCode: userTable.postalCode,
        address: userTable.address,
        createdAt: userTable.createdAt,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderedAt: stats.lastOrderedAt,
      })
      .from(userTable)
      // 法人は /admin/customers の既存タブが扱う。ここは個人だけ。
      // role が空の古いアカウントも個人として拾う。
      .where(
        and(
          or(eq(userTable.role, "personal"), isNull(userTable.role)),
          q
            ? or(
                like(userTable.name, `%${q}%`),
                like(userTable.email, `%${q}%`),
              )
            : undefined,
        ),
      )
      .leftJoin(stats, eq(stats.userId, userTable.id))
      .orderBy(desc(userTable.createdAt))
      .limit(200);

    return {
      ok: true,
      customers: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: Boolean(row.emailVerified),
        phone: row.phone,
        postalCode: row.postalCode,
        address: row.address,
        createdAt: row.createdAt,
        orderCount: Number(row.orderCount ?? 0),
        totalSpent: Number(row.totalSpent ?? 0),
        lastOrderedAt: row.lastOrderedAt
          ? new Date(Number(row.lastOrderedAt))
          : null,
      })),
    };
  } catch {
    return { ok: false, error: "db" };
  }
}
