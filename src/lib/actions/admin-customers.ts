"use server";

import { headers } from "next/headers";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";

export type BusinessAccount = {
  id: string;
  contactName: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  createdAt: Date;
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
      })
      .from(userTable)
      .where(where)
      .orderBy(desc(userTable.createdAt))
      .limit(300);

    return { ok: true, accounts: rows };
  } catch {
    return { ok: false, error: "db" };
  }
}
