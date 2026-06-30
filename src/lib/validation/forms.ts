import { z } from "zod";

/** UI でローカライズして表示するためのエラーキー（メッセージ文字列ではなくキーを返す）。 */
export type FieldErrorKey =
  | "required"
  | "email"
  | "min8"
  | "url"
  | "agree"
  | "postal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;
/** 日本の郵便番号（7桁。ハイフン任意）。発送は国内のみのためこの形式に限定する。 */
const JP_POSTAL_RE = /^\d{3}-?\d{4}$/;

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

/** 日本国内の郵便番号（必須＋7桁形式）。海外発送は受け付けないための国内ゲート。 */
const jpPostalString = z
  .string()
  .refine((v) => v.trim().length > 0, "required")
  .refine((v) => JP_POSTAL_RE.test(v.trim()), "postal");

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

export const contactSchema = z.object({
  name: requiredString,
  email: emailString,
  subject: requiredString,
  message: requiredString,
});

export const wholesaleSchema = z.object({
  company: requiredString,
  contactName: requiredString,
  email: emailString,
  phone: z.string().optional(),
  country: requiredString,
  website: z.string().refine((v) => v === "" || URL_RE.test(v.trim()), "url"),
  message: z.string().optional(),
  licenseConfirmed: z.boolean().refine((v) => v === true, "agree"),
});

export const checkoutSchema = z.object({
  name: requiredString,
  email: emailString,
  // 発送は日本国内のみ。郵便番号は日本の7桁形式を必須とする。
  postalCode: jpPostalString,
  address: requiredString,
  phone: requiredString,
  ageConfirmed: z.boolean().refine((v) => v === true, "agree"),
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
