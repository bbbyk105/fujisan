import type { FieldErrorKey } from "./forms";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * ゲスト購入のメールアドレスの問題。無ければ null。
 *
 * 確認メールと領収書の宛先なので必須。全角文字や連続したドットは Stripe が拒否する。
 * ログインと違って確認メールの段階が無く、Stripe で拒否されると原因が分からないので、
 * ここで入力欄のエラーにする。カートでも使うので zod に依存させない。
 */
export function guestEmailIssue(value: unknown): FieldErrorKey | null {
  const email = typeof value === "string" ? value.trim() : "";
  if (!email) return "required";
  const valid =
    EMAIL_RE.test(email) &&
    /^[\x21-\x7e]+$/.test(email) &&
    !email.includes("..");
  return valid ? null : "email";
}
