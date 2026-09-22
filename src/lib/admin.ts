import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";

/** 2 階層の管理者ロール（owner > staff）。null は通常顧客。 */
export type AdminRole = "owner" | "staff";

/**
 * env の ADMIN_EMAILS（カンマ区切り）→ 小文字 trim 済みの配列。
 *
 * **ソースにフォールバックの管理者アドレスは置かない。**
 * 以前は個人のメールアドレスが定数としてコミットされており、`ADMIN_EMAILS` を
 * 設定し忘れた環境では常にそのアドレスが owner になってしまっていた。
 * 未設定なら owner は 0 人（＝誰も管理画面に入れない）とし、設定漏れを
 * 静かに握りつぶさず警告する。DB 側で admin_role を持つユーザーは影響を受けない。
 */
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
    console.warn(
      "[admin] ADMIN_EMAILS が未設定です。env owner は 0 人として扱います" +
        "（.dev.vars もしくは `wrangler secret put ADMIN_EMAILS` で設定してください）。",
    );
  } catch {
    // ビルド時など env が引けない文脈。owner 判定は実行時にしか意味がないので空でよい。
  }
  return [];
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
