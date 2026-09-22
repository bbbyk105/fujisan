import { getAuth } from "@/lib/auth";
import { sweepRateLimitCounters } from "@/lib/rate-limit";

/**
 * Better Auth の HTTP エンドポイント。
 *
 * ここはレート制限が効く面（`src/lib/auth.ts` の `rateLimit`）。Better Auth は
 * カウンタ行を**自分では消さない**ので、ついでに古い行を掃除する
 * （key に生 IP が入るため、放っておくと無期限に残る）。掃除は間引いて走り、
 * 応答は待たない。
 */
export async function GET(req: Request) {
  const auth = await getAuth();
  const res = await auth.handler(req);
  void sweepRateLimitCounters();
  return res;
}

export async function POST(req: Request) {
  const auth = await getAuth();
  const res = await auth.handler(req);
  void sweepRateLimitCounters();
  return res;
}
