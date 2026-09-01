import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";

/** 2 階層の管理者ロール（owner > staff）。null は通常顧客。 */
export type AdminRole = "owner" | "staff";

/**
 * 既定の owner（ブートストラップ用）。
 * env の ADMIN_EMAILS が未設定でも最低限 1 人は owner として扱う。
 * 本番では Cloudflare の secret `ADMIN_EMAILS` をカンマ区切りで設定する。
 */
const FALLBACK_OWNER_EMAILS = ["byakkokondo@gmail.com"];

/** env の ADMIN_EMAILS（カンマ区切り）→ 小文字 trim 済みの配列。 */
export async function getOwnerEmailsFromEnv(): Promise<string[]> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const raw = (env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS;
    if (raw && raw.trim()) {
      return raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
  } catch {
    /* DEV で env が引けない場合はフォールバックへ */
  }
  return FALLBACK_OWNER_EMAILS.map((s) => s.toLowerCase());
}

/** env の owner リストに該当するか（DB レコードは見ない、ブートストラップ専用）。 */
export async function isEnvOwnerEmail(email: string | undefined | null) {
  if (!email) return false;
  const list = await getOwnerEmailsFromEnv();
  return list.includes(email.trim().toLowerCase());
}

/**
 * ユーザーの実効ロールを返す。env の owner は DB を見るまでもなく owner 扱い。
 * それ以外は DB の `admin_role` を読み、未設定なら null（通常顧客）。
 */
export async function getEffectiveAdminRole(args: {
  userId: string | undefined;
  email: string | undefined | null;
}): Promise<AdminRole | null> {
  if (await isEnvOwnerEmail(args.email)) return "owner";
  if (!args.userId) return null;
  try {
    const db = await getDb();
    const [row] = await db
      .select({ adminRole: userTable.adminRole })
      .from(userTable)
      .where(eq(userTable.id, args.userId))
      .limit(1);
    const r = row?.adminRole;
    if (r === "owner" || r === "staff") return r;
    return null;
  } catch {
    return null;
  }
}

/** staff 以上か（注文ページ用）。owner も含む。 */
export function isStaffOrAbove(role: AdminRole | null): role is AdminRole {
  return role === "owner" || role === "staff";
}

/** owner だけ（チーム管理用）。 */
export function isOwner(role: AdminRole | null): role is "owner" {
  return role === "owner";
}

/** 管理者ゲートの結果。Server Action の先頭で使う。 */
export type AdminGate =
  | { ok: true; userId: string; email: string; role: AdminRole }
  | { ok: false; reason: "unauth" | "forbidden" };

/**
 * セッションから実効ロールを引き、必要な権限を満たすか判定する。
 * middleware を置かない方針のため、Server Action は必ずこれを先頭で呼ぶ。
 */
export async function requireAdmin(need: "staff" | "owner"): Promise<AdminGate> {
  const { headers } = await import("next/headers");
  const { getAuth } = await import("@/lib/auth");
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };

  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  const allowed = need === "owner" ? isOwner(role) : isStaffOrAbove(role);
  if (!allowed || !role) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: u.id, email: u.email, role };
}
