"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { classifyAuthError, type AuthErrorKey } from "@/lib/auth-errors";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import {
  getFieldErrors,
  loginSchema,
  registerPersonalSchema,
  registerBusinessSchema,
} from "@/lib/validation/forms";

function isValid(schema: Parameters<typeof getFieldErrors>[0], data: unknown) {
  return Object.keys(getFieldErrors(schema, data)).length === 0;
}

export type AuthActionResult = { ok: true } | { ok: false; error: AuthErrorKey };

/** 新規登録時の重複チェック。同名（前後空白除去で完全一致）が既にあれば "name-taken" を返す。 */
async function findDuplicate(
  name: string,
): Promise<"name-taken" | null> {
  const db = await getDb();
  const normalized = name.trim();
  const hits = await db
    .select({ id: userTable.id, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.name, normalized))
    .limit(1);
  if (hits.length > 0) return "name-taken";
  return null;
}

/** メール+パスワードのログイン。成功時は nextCookies がセッション cookie を設定する。 */
export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!isValid(loginSchema, input)) return { ok: false, error: "generic" };
  const auth = await getAuth();
  try {
    await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/** 個人（toC）の新規登録。role はサーバー側で "personal" に固定する。 */
export async function registerPersonalAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!isValid(registerPersonalSchema, input))
    return { ok: false, error: "generic" };
  const dup = await findDuplicate(input.name);
  if (dup) return { ok: false, error: dup };
  const auth = await getAuth();
  try {
    await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: "personal",
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/** 法人（toB）の新規登録。role はサーバー側で "business" に固定する。 */
export async function registerBusinessAction(input: {
  contactName: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
  address?: string;
}): Promise<AuthActionResult> {
  if (!isValid(registerBusinessSchema, input))
    return { ok: false, error: "generic" };
  const dup = await findDuplicate(input.contactName);
  if (dup) return { ok: false, error: dup };
  const auth = await getAuth();
  try {
    await auth.api.signUpEmail({
      body: {
        name: input.contactName,
        email: input.email,
        password: input.password,
        role: "business",
        companyName: input.companyName,
        phone: input.phone ?? "",
        address: input.address ?? "",
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/** ログアウト（セッション cookie をクリア）。 */
export async function signOutAction(): Promise<void> {
  const auth = await getAuth();
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    /* 既に無効なセッションでも無視 */
  }
}

/**
 * 退会（アカウント削除）。ログイン中のユーザーを D1 から物理削除する。
 * session / account は user.id への onDelete: cascade で自動的に消える。
 * その後 signOut でセッション cookie もクリアする。
 */
export async function deleteAccountAction(): Promise<AuthActionResult> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "invalid" };
  try {
    const db = await getDb();
    await db.delete(userTable).where(eq(userTable.id, session.user.id));
    // セッション cookie を確実にクリア（行が消えても残ると 401 ループの原因になる）
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      /* 既に無効なら無視 */
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Google OAuth の開始 URL をサーバーで生成して返す。クライアントはこの URL へ遷移する。 */
export async function googleStartAction(
  callbackURL: string,
): Promise<{ url: string | null }> {
  const auth = await getAuth();
  try {
    const res = await auth.api.signInSocial({
      body: { provider: "google", callbackURL },
      headers: await headers(),
    });
    return { url: (res as { url?: string })?.url ?? null };
  } catch {
    return { url: null };
  }
}
