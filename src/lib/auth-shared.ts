/**
 * 認証の「追加ユーザー項目」をサーバー (auth.ts) とクライアント (auth-client.ts)
 * の双方で共有する。サーバー専用の依存を含めないこと（クライアントから import される）。
 */

export const ACCOUNT_ROLES = ["personal", "business"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/**
 * 確認メールのリンクを踏んだあとの戻り先。
 *
 * Better Auth は確認に成功するとここへリダイレクトし、失敗すると
 * `?error=TOKEN_EXPIRED` / `INVALID_TOKEN` を付けて同じ所へ戻す。
 * 以前は会員登録で `callbackURL` を渡しておらず、確認してもトップへ戻るだけで
 * 何も起きていないように見えた。
 */
export const EMAIL_VERIFIED_PATH = "/email-verified";

/**
 * 確認リンク・パスワード再設定リンクの有効期限（秒）。Better Auth に渡す値と、
 * メールや画面に書く「1 時間」の両方をここから取る（片方だけ変えると案内が嘘になる）。
 */
export const AUTH_LINK_TTL_SEC = 60 * 60;

export function emailVerifiedCallbackURL(role: AccountRole): string {
  return role === "business"
    ? `${EMAIL_VERIFIED_PATH}?role=business`
    : EMAIL_VERIFIED_PATH;
}

/** Better Auth の user テーブルに追加するカスタム項目。 */
export const additionalUserFields = {
  /** "personal"（個人 / toC）か "business"（法人・取扱店 / toB） */
  role: {
    type: "string",
    required: false,
    defaultValue: "personal",
    input: true,
  },
  /** 法人の会社・店舗名（toB のみ） */
  companyName: {
    type: "string",
    required: false,
    input: true,
  },
  phone: {
    type: "string",
    required: false,
    input: true,
  },
  /** 郵便番号（ハイフンなし7桁）。住所とセットで注文時のお届け先に使う。 */
  postalCode: {
    type: "string",
    required: false,
    input: true,
  },
  address: {
    type: "string",
    required: false,
    input: true,
  },
} as const;
