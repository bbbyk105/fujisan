export type AuthErrorKey =
  | "invalid"
  | "unverified"
  | "exists"
  | "weak"
  /** パスワードが長すぎる（Better Auth の既定上限は 128 文字）。 */
  | "too-long"
  /** パスワードを持たないアカウント（Google ログインのみで登録された場合）。 */
  | "no-password"
  /** 短時間に試行しすぎ（`src/lib/rate-limit.ts`）。 */
  | "rate"
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

  // ここから下は「◯◯_PASSWORD」系が並ぶ。どれも "PASSWORD" を含むので、
  // 末尾の weak 判定より **必ず先に** 具体的なコードを見ること。
  // （以前は INVALID_PASSWORD が weak に落ち、現在のパスワードを間違えた人に
  //   「8文字以上で設定してください」と表示していた）

  // Google ログインのみのアカウントにはパスワードが存在しない
  // （CREDENTIAL_ACCOUNT_NOT_FOUND）。下の CREDENTIAL より先に判定する。
  if (has("CREDENTIAL_ACCOUNT_NOT_FOUND")) return "no-password";
  // 現在のパスワードが違う（changePassword の INVALID_PASSWORD）。
  // code は "INVALID_PASSWORD"、message は "Invalid password" と表記が割れるので両方見る。
  if (has("INVALID_PASSWORD") || has("INVALID PASSWORD")) return "invalid";
  // パスワードが長すぎる（PASSWORD_TOO_LONG）。短いのとは案内が逆になる。
  if (has("TOO_LONG") || has("TOO LONG")) return "too-long";
  // 認証情報の誤り（401 / INVALID_EMAIL_OR_PASSWORD）
  if (status === 401 || has("INVALID_EMAIL_OR_PASSWORD") || has("CREDENTIAL"))
    return "invalid";
  // パスワードが弱い／短い
  if (has("PASSWORD") || has("SHORT") || has("WEAK") || has("AT LEAST"))
    return "weak";
  return "generic";
}
