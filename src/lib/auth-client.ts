"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { additionalUserFields } from "./auth-shared";

// 認証のミューテーション（ログイン/登録/ログアウト/Google）は Server Actions 側に集約。
// クライアントはヘッダーナビのセッション表示にのみ useSession を使う。
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: additionalUserFields })],
});

export const { useSession } = authClient;
