export type AuthErrorKey =
  | "invalid"
  | "unverified"
  | "exists"
  | "weak"
  | "generic";

type LooseError = {
  status?: number;
  statusCode?: number;
  code?: string;
  message?: string;
  body?: { code?: string; message?: string };
} | null;

/**
 * Better Auth のサーバー API / クライアントが返すエラーを、UI で扱う安定したキーに分類する純関数。
 * code・status・message のいずれからでも判定できるよう緩く受ける（テスト可能・副作用なし）。
 */
export function classifyAuthError(error: unknown): AuthErrorKey {
  const e = (error ?? null) as LooseError;
  const code = (e?.code ?? e?.body?.code ?? "").toUpperCase();
  const message = (e?.message ?? e?.body?.message ?? "").toUpperCase();
  const status = e?.status ?? e?.statusCode;
  const has = (s: string) => code.includes(s) || message.includes(s);

  // メール未認証（403 / EMAIL_NOT_VERIFIED）
  if (status === 403 || has("VERIF")) return "unverified";
  // 既に登録済み（422 / USER_ALREADY_EXISTS）
  if (status === 422 || has("EXIST") || has("ALREADY")) return "exists";
  // 認証情報の誤り（401 / INVALID_EMAIL_OR_PASSWORD）— "PASSWORD" を含むが weak より先に判定する
  if (status === 401 || has("INVALID_EMAIL_OR_PASSWORD") || has("CREDENTIAL"))
    return "invalid";
  // パスワードが弱い／短い
  if (has("PASSWORD") || has("SHORT") || has("WEAK") || has("AT LEAST"))
    return "weak";
  return "generic";
}
