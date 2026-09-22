import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tradeAccount } from "@/db/trade-schema";
import type { TradeBusinessType, TradeStatus } from "@/data/fujisan-trade";

/**
 * 取扱店アカウントの審査状態を読む。
 *
 * **行が無い場合は null を返し、呼び出し側は「未承認」として扱う。**
 * `user.role === "business"` を承認の代わりにしてはいけない（登録は自己申告で、
 * 誰でも法人として登録できてしまうため）。
 */
export type TradeAccountRecord = {
  userId: string;
  status: TradeStatus;
  businessType: TradeBusinessType;
  licenceNumber: string | null;
  appliedAt: Date;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  reviewNote: string | null;
};

export async function readTradeAccount(
  userId: string,
): Promise<TradeAccountRecord | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tradeAccount)
    .where(eq(tradeAccount.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.userId,
    status: row.status as TradeStatus,
    businessType: row.businessType as TradeBusinessType,
    licenceNumber: row.licenceNumber,
    appliedAt: row.appliedAt,
    reviewedAt: row.reviewedAt ?? null,
    reviewedByEmail: row.reviewedByEmail,
    reviewNote: row.reviewNote,
  };
}

/**
 * 卸価格を見せてよいユーザーか。
 *
 * 判定は「role が business」かつ「審査が approved」。DB が落ちているときは
 * **見せない側に倒す**（価格は一度見られたら取り消せない）。
 */
export async function canSeeWholesalePricing(
  session: { user?: { id?: string; role?: string | null } } | null,
): Promise<boolean> {
  const user = session?.user;
  if (!user?.id || user.role !== "business") return false;
  try {
    const account = await readTradeAccount(user.id);
    return account?.status === "approved";
  } catch {
    return false;
  }
}

/**
 * 登録時に審査待ちの行を作る。
 *
 * サインアップ自体は成功しているので、ここで失敗しても登録をなかったことには
 * しない（呼び出し側は false を受けてログに残すだけ）。行が無ければ未承認として
 * 扱われるため、取りこぼしても卸価格が漏れることはない。
 */
export async function createTradeApplication(input: {
  userId: string;
  businessType: TradeBusinessType;
  licenceNumber?: string | null;
}): Promise<boolean> {
  try {
    const db = await getDb();
    await db
      .insert(tradeAccount)
      .values({
        userId: input.userId,
        status: "pending",
        businessType: input.businessType,
        licenceNumber: input.licenceNumber?.trim() || null,
      })
      .onConflictDoNothing();
    return true;
  } catch (error) {
    console.error("[trade] 申請行の作成に失敗しました", error);
    return false;
  }
}
