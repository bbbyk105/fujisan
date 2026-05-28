/**
 * 認証の「追加ユーザー項目」をサーバー (auth.ts) とクライアント (auth-client.ts)
 * の双方で共有する。サーバー専用の依存を含めないこと（クライアントから import される）。
 */

export const ACCOUNT_ROLES = ["personal", "business"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

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
  address: {
    type: "string",
    required: false,
    input: true,
  },
} as const;
