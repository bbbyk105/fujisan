"use server";

import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { classifyAuthError, type AuthErrorKey } from "@/lib/auth-errors";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { order as orderTable } from "@/db/orders-schema";
import {
  getFieldErrors,
  isEmailLike,
  loginSchema,
  registerPersonalSchema,
  registerBusinessSchema,
} from "@/lib/validation/forms";
import {
  clientIpFrom,
  consumeRateLimit,
  type RateLimitBucket,
} from "@/lib/rate-limit";
import { createTradeApplication } from "@/lib/trade";
import type { TradeBusinessType } from "@/data/fujisan-trade";
import {
  sendTradeApplicationNotification,
  sendTradeApplicationAcknowledgement,
} from "@/lib/emails/trade-emails";

function isValid(schema: Parameters<typeof getFieldErrors>[0], data: unknown) {
  return Object.keys(getFieldErrors(schema, data)).length === 0;
}

export type AuthActionResult = { ok: true } | { ok: false; error: AuthErrorKey };

/**
 * 送信元 IP でレート制限を 1 回ぶん消費する。
 *
 * **Better Auth 側の `rateLimit` は当てにできない。** あれが効くのは
 * `auth.handler()`（`/api/auth/[...all]`）への HTTP リクエストだけで、
 * ここのように Server Action から `auth.api.*` を直接呼ぶ経路は通らない。
 * パスワードの総当たりも認証メールの大量送信も、ここで止める。
 */
async function limit(bucket: RateLimitBucket): Promise<boolean> {
  const res = await consumeRateLimit({
    bucket,
    ip: clientIpFrom(await headers()),
  });
  return res.ok;
}

// 氏名の重複チェックは行わない。
// 以前は同姓同名を "name-taken" で弾いていたが、氏名は本来一意ではなく、
// 「佐藤 健」さんが 2 人目から登録できなかった。アカウントの一意性は
// メールアドレスで担保する（Better Auth が USER_ALREADY_EXISTS を返す）。

/** メール+パスワードのログイン。成功時は nextCookies がセッション cookie を設定する。 */
export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!isValid(loginSchema, input)) return { ok: false, error: "generic" };
  if (!(await limit("signIn"))) return { ok: false, error: "rate" };
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
  if (!(await limit("signUp"))) return { ok: false, error: "rate" };
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

/**
 * 法人（toB）の新規登録。role はサーバー側で "business" に固定する。
 *
 * **登録＝取引開始ではない。** 作られるのは審査待ち（pending）の申請で、
 * 卸価格は蔵が承認するまで表示されない（`src/lib/trade.ts`）。以前は登録した
 * 瞬間に卸価格が見えており、サイトに書いてある「免許確認のうえ口座開設」と
 * 実装が食い違っていた。
 */
export async function registerBusinessAction(input: {
  contactName: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
  address?: string;
  businessType: string;
  licenceNumber?: string;
}): Promise<AuthActionResult> {
  if (!isValid(registerBusinessSchema, input))
    return { ok: false, error: "generic" };
  if (!(await limit("signUp"))) return { ok: false, error: "rate" };
  const businessType = input.businessType as TradeBusinessType;
  const auth = await getAuth();
  let userId: string | undefined;
  try {
    const res = await auth.api.signUpEmail({
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
    userId = (res as { user?: { id?: string } } | undefined)?.user?.id;
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }

  // ここから先は登録済み。失敗しても登録は取り消さない（行が無い法人は
  // 未承認として扱われるので、取りこぼしても卸価格が漏れることはない）。
  if (userId) {
    await createTradeApplication({
      userId,
      businessType,
      licenceNumber: input.licenceNumber,
    });
  } else {
    console.error("[trade] signUpEmail が user.id を返さず、申請行を作れませんでした");
  }

  const applicant = {
    companyName: input.companyName.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim(),
    businessType,
    licenceNumber: input.licenceNumber?.trim() || null,
  };
  try {
    await sendTradeApplicationNotification(applicant);
    await sendTradeApplicationAcknowledgement(applicant);
  } catch (error) {
    console.error("[trade] 申請の通知メールに失敗しました", error);
  }

  return { ok: true };
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

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: AuthErrorKey | "active-orders" };

/** お届けが完了していない（＝退会をブロックする）注文ステータス。 */
const UNDELIVERED_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
] as const;

/**
 * 退会（アカウント削除）。ログイン中のユーザーを D1 から物理削除する。
 * お届けが完了していない注文（受付済〜発送済み）が残っている間は退会できない
 * （配送先・連絡先が消えて発送・返金対応ができなくなるため）。
 * session / account は user.id への onDelete: cascade で自動的に消える。
 * その後 signOut でセッション cookie もクリアする。
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "invalid" };
  try {
    const db = await getDb();

    // 進行中（未配達）の注文があれば退会をブロックする。
    const undelivered = await db
      .select({ id: orderTable.id })
      .from(orderTable)
      .where(
        and(
          eq(orderTable.userId, session.user.id),
          inArray(orderTable.status, [...UNDELIVERED_STATUSES]),
        ),
      )
      .limit(1);
    if (undelivered.length > 0) {
      return { ok: false, error: "active-orders" };
    }

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

/**
 * メール認証リンクの再送。
 * アカウントの有無や認証済みかどうかは漏らさず、形式が正しければ常に ok を返す
 * （存在しない・既に認証済みなどで better-auth が失敗しても成功として扱う）。
 */
export async function resendVerificationAction(input: {
  email: string;
  role?: "personal" | "business";
}): Promise<AuthActionResult> {
  const email = input.email.trim();
  if (!isEmailLike(email)) return { ok: false, error: "invalid" };
  // 認証メールは「誰でも・何度でも」送れてしまうので、ここは必ず絞る。
  if (!(await limit("sendEmail"))) return { ok: false, error: "rate" };
  const callbackURL = input.role === "business" ? "/shop/business" : "/account";
  const auth = await getAuth();
  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL },
      headers: await headers(),
    });
  } catch {
    /* 列挙攻撃を避けるため、失敗しても成功として扱う */
  }
  return { ok: true };
}

/**
 * パスワード再設定メールの送信を要求する。
 * アカウント列挙を避けるため、形式が正しければ存在有無に関わらず常に ok を返す。
 * redirectTo は better-auth がリンク先（/reset-password?token=...）の組み立てに使う。
 */
export async function requestPasswordResetAction(input: {
  email: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim();
  if (!isEmailLike(email)) return { ok: false, error: "invalid" };
  if (!(await limit("sendEmail"))) return { ok: false, error: "rate" };
  const auth = await getAuth();
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch {
    /* 列挙攻撃を避けるため、失敗しても成功として扱う */
  }
  return { ok: true };
}

/**
 * トークンと新しいパスワードでパスワードを再設定する。
 * トークン期限切れ・不正・パスワード不備などは error キーで返す。
 */
export async function resetPasswordAction(input: {
  token: string;
  password: string;
}): Promise<AuthActionResult> {
  const token = input.token.trim();
  if (!token) return { ok: false, error: "invalid" };
  if (input.password.length < 8) return { ok: false, error: "weak" };
  // トークンは推測しにくいだけなので、総当たりの回数自体を絞る。
  if (!(await limit("verify"))) return { ok: false, error: "rate" };
  const auth = await getAuth();
  try {
    await auth.api.resetPassword({
      body: { token, newPassword: input.password },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/**
 * ログイン中のユーザーが自分でパスワードを変更する。
 *
 * 現在のパスワードの確認を Better Auth 側に任せる（誤りなら例外 → "invalid"）。
 * 変更に成功したら **他端末のセッションを失効させる**。パスワードを変えたい
 * 動機の多くは「乗っ取られたかもしれない」なので、今の端末だけ残すのが安全。
 */
export async function changeMyPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "invalid" };

  if (input.newPassword.length < 8) return { ok: false, error: "weak" };
  if (!input.currentPassword) return { ok: false, error: "invalid" };
  // 端末を奪われたときに、現在のパスワードを総当たりされるのを防ぐ。
  if (!(await limit("verify"))) return { ok: false, error: "rate" };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: classifyAuthError(error) };
  }
}

/**
 * Google OAuth の開始 URL をサーバーで生成して返す。クライアントはこの URL へ遷移する。
 * errorCallbackURL を指定すると、OAuth 失敗時に Better Auth の素のエラーページではなく
 * そのパスへ ?error=... 付きで戻される。
 */
export async function googleStartAction(
  callbackURL: string,
  errorCallbackURL?: string,
): Promise<{ url: string | null }> {
  const auth = await getAuth();
  try {
    const res = await auth.api.signInSocial({
      body: { provider: "google", callbackURL, errorCallbackURL },
      headers: await headers(),
    });
    return { url: (res as { url?: string })?.url ?? null };
  } catch {
    return { url: null };
  }
}
