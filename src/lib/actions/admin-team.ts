"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import {
  getEffectiveAdminRole,
  isOwner,
  isEnvOwnerEmail,
  type AdminRole,
} from "@/lib/admin";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  /** env で owner 指定されている＝ DB の admin_role を消してもこの人は owner のまま */
  isEnvOwner: boolean;
  createdAt: Date;
};

async function requireOwner(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isOwner(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: u.id, email: u.email };
}

/**
 * チーム一覧取得。
 * - `admins=true`: admin_role が付いているユーザーのみ
 * - `q`: 名前 / メールの部分一致検索
 * env owner は常に上位（手動で外せない）として表示する。
 */
export async function adminListTeamAction(input?: {
  adminsOnly?: boolean;
  q?: string;
}): Promise<
  | { ok: true; members: TeamMember[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireOwner();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const q = (input?.q ?? "").trim();

    const where = and(
      input?.adminsOnly
        ? sql`${userTable.adminRole} IS NOT NULL`
        : undefined,
      q
        ? or(
            like(userTable.name, `%${q}%`),
            like(userTable.email, `%${q}%`),
          )
        : undefined,
    );

    const rows = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        adminRole: userTable.adminRole,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(where)
      .orderBy(desc(userTable.createdAt))
      .limit(200);

    const members: TeamMember[] = [];
    for (const row of rows) {
      const envOwner = await isEnvOwnerEmail(row.email);
      const role: AdminRole | null = envOwner
        ? "owner"
        : row.adminRole === "owner" || row.adminRole === "staff"
          ? row.adminRole
          : null;
      // adminsOnly フィルタ時は実効ロール無しは除外
      if (input?.adminsOnly && !role) continue;
      members.push({
        id: row.id,
        name: row.name,
        email: row.email,
        adminRole: role as AdminRole,
        isEnvOwner: envOwner,
        createdAt: row.createdAt,
      });
    }

    return { ok: true, members };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * メンバーのロールを更新する。
 * - role: "owner" | "staff" | null（null は一般顧客に降格）
 * - 自分自身を降格すると鍵を失うので拒否
 * - env owner は DB を弄らせない（消しても env で owner のままだが、混乱を避けるため）
 * - 最後の owner を降格しようとしたら拒否（鍵紛失防止）
 */
export async function adminSetMemberRoleAction(input: {
  userId: string;
  role: AdminRole | null;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauth"
        | "forbidden"
        | "invalid"
        | "self_demote"
        | "env_owner_protected"
        | "last_owner"
        | "db";
    }
> {
  const gate = await requireOwner();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.userId) return { ok: false, error: "invalid" };
  if (input.role !== null && input.role !== "owner" && input.role !== "staff")
    return { ok: false, error: "invalid" };

  // 自分を降格させない（鍵を自分から取り上げない）
  if (input.userId === gate.userId && input.role !== "owner") {
    return { ok: false, error: "self_demote" };
  }

  try {
    const db = await getDb();
    // 対象ユーザーの現状を取得
    const [target] = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        adminRole: userTable.adminRole,
      })
      .from(userTable)
      .where(eq(userTable.id, input.userId))
      .limit(1);

    if (!target) return { ok: false, error: "invalid" };

    // env owner は DB から書き換えても無効。混乱を避けるためここでブロック。
    if (await isEnvOwnerEmail(target.email)) {
      return { ok: false, error: "env_owner_protected" };
    }

    // owner を staff/null に降格しようとしている場合、最後の owner かチェック
    const isDemotion =
      target.adminRole === "owner" && input.role !== "owner";
    if (isDemotion) {
      const ownersInDb = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.adminRole, "owner"));
      // 自分が env owner でないなら、DB の owner 残数が 1 で対象がその 1 なら拒否
      const remainingAfter = ownersInDb.filter(
        (o) => o.id !== input.userId,
      ).length;
      const meIsEnvOwner = await isEnvOwnerEmail(gate.email);
      if (remainingAfter === 0 && !meIsEnvOwner) {
        return { ok: false, error: "last_owner" };
      }
    }

    await db
      .update(userTable)
      .set({ adminRole: input.role })
      .where(eq(userTable.id, input.userId));

    revalidatePath("/admin/team");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
