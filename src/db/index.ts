import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * D1 バインディングはリクエスト時にしか取れないため、毎回 Cloudflare コンテキスト
 * から取得して drizzle クライアントを作る。`async: true` は静的/初期化経路でも動く。
 */
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
