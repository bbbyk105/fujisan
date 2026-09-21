import { z } from "zod";

/** UI でローカライズして表示するためのエラーキー（メッセージ文字列ではなくキーを返す）。 */
export type FieldErrorKey =
  | "required"
  | "email"
  | "min8"
  /** 文字数が上限を超えている */
  | "long"
  | "url"
  | "agree"
  | "postal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 前後空白を除いてメール形式かどうかを判定する純関数（再送アクション等で再利用）。 */
export function isEmailLike(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

const requiredString = z
  .string()
  .refine((v) => v.trim().length > 0, "required");

const emailString = z
  .string()
  .refine((v) => v.trim().length > 0, "required")
  .refine((v) => EMAIL_RE.test(v.trim()), "email");

const password = z
  .string()
  .refine((v) => v.length > 0, "required")
  .refine((v) => v.length >= 8, "min8");

export const loginSchema = z.object({
  email: emailString,
  password: z.string().refine((v) => v.length > 0, "required"),
});

export const registerPersonalSchema = z.object({
  name: requiredString,
  email: emailString,
  password,
});

export const registerBusinessSchema = z.object({
  companyName: requiredString,
  contactName: requiredString,
  email: emailString,
  phone: z.string().optional(),
  address: z.string().optional(),
  password,
});

export const forgotPasswordSchema = z.object({
  email: emailString,
});

export const resetPasswordSchema = z.object({
  password,
});

/**
 * お問い合わせ。
 *
 * **上限はスキーマ側で持つ。** textarea の `maxLength` はブラウザの入力補助に
 * すぎず、Server Action は直接呼べるため、これが無いと巨大な行を
 * `contact_message` に書き込める。
 */
export const CONTACT_MESSAGE_MAX = 1000;
const CONTACT_NAME_MAX = 100;
const CONTACT_EMAIL_MAX = 254; // RFC 5321 のアドレス長上限

export const contactSchema = z.object({
  name: requiredString.refine((v) => v.trim().length <= CONTACT_NAME_MAX, "long"),
  email: emailString.refine((v) => v.trim().length <= CONTACT_EMAIL_MAX, "long"),
  subject: requiredString,
  message: requiredString.refine(
    (v) => v.trim().length <= CONTACT_MESSAGE_MAX,
    "long",
  ),
});

/**
 * スキーマで検証し、`{ フィールド名: エラーキー }` を返す純関数。
 * 1 フィールドにつき最初のエラーのみ採用する。エラーが無ければ空オブジェクト。
 */
export function getFieldErrors(
  schema: z.ZodType,
  data: unknown,
): Record<string, FieldErrorKey> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: Record<string, FieldErrorKey> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in errors)) errors[key] = issue.message as FieldErrorKey;
  }
  return errors;
}
