"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { classifyAuthError, type AuthErrorKey } from "@/lib/auth-errors";
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
