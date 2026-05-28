import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { getAuth } from "./auth";

/** サーバーコンポーネントからセッションを読む（同一リクエスト内ではキャッシュ）。 */
export const getSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
});

/**
 * 公開ページ用。auth の構成不備（例: 本番で BETTER_AUTH_SECRET 未設定）で
 * getSession が throw しても、未ログイン扱い(null)に縮退してページ全体を落とさない。
 * 認証が必須の経路（/account・API）では使わず getSession を直接使うこと。
 */
export const getSessionSafe = cache(async () => {
  try {
    return await getSession();
  } catch (err) {
    // notFound/redirect や headers による動的化など Next.js の制御例外は握りつぶさない。
    unstable_rethrow(err);
    console.error("[session] getSession failed; treating as signed-out:", err);
    return null;
  }
});
