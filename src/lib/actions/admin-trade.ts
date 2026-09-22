"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { tradeAccount } from "@/db/trade-schema";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import {
  TRADE_REVIEW_NOTE_MAX,
  TRADE_STATUSES,
  type TradeStatus,
  type TradeBusinessType,
} from "@/data/fujisan-trade";
import {
  sendTradeApprovedEmail,
  sendTradeRejectedEmail,
} from "@/lib/emails/trade-emails";

async function requireStaff(): Promise<
  { ok: true; email: string } | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, email: u.email };
}

export type TradeReviewResult =
  | { ok: true }
  | { ok: false; error: "unauth" | "forbidden" | "invalid" | "notfound" | "db" };

/**
 * 取扱店アカウントの審査を進める（承認 / 見送り）。
 *
 * **行が無い法人にも使える（upsert）**。この機能より前に登録した法人には
 * `trade_account` の行が無いため、承認したときに業態 "other" で作る。
 * ここで作らないと、既存のお客様が永久に未承認のままになる。
 *
 * メール送信は **ベストエフォート**。審査の正は D1 なので、送れなくても
 * 審査結果は確定させる（管理者が電話で伝えることもできる）。
 */
export async function adminReviewTradeAccountAction(input: {
  userId: string;
  status: Extract<TradeStatus, "approved" | "rejected">;
  note?: string;
}): Promise<TradeReviewResult> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.userId) return { ok: false, error: "invalid" };
  if (input.status !== "approved" && input.status !== "rejected") {
    return { ok: false, error: "invalid" };
  }
  if (!TRADE_STATUSES.includes(input.status)) {
    return { ok: false, error: "invalid" };
  }
  const note = (input.note ?? "").trim().slice(0, TRADE_REVIEW_NOTE_MAX);

  let target: {
    email: string;
    contactName: string;
    companyName: string | null;
  };
  try {
    const db = await getDb();
    const rows = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        companyName: userTable.companyName,
        role: userTable.role,
      })
      .from(userTable)
      .where(eq(userTable.id, input.userId))
      .limit(1);
    const row = rows[0];
    if (!row || row.role !== "business") return { ok: false, error: "notfound" };
    target = {
      email: row.email,
      contactName: row.name,
      companyName: row.companyName,
    };

    const now = new Date();
    await db
      .insert(tradeAccount)
      .values({
        userId: input.userId,
        status: input.status,
        // この機能より前に登録した法人には申請の内容が無い。
        businessType: "other" satisfies TradeBusinessType,
        appliedAt: now,
        reviewedAt: now,
        reviewedByEmail: gate.email,
        reviewNote: note || null,
      })
      .onConflictDoUpdate({
        target: tradeAccount.userId,
        set: {
          status: input.status,
          reviewedAt: now,
          reviewedByEmail: gate.email,
          reviewNote: note || null,
        },
      });
  } catch {
    return { ok: false, error: "db" };
  }

  try {
    const payload = {
      companyName: target.companyName || target.contactName,
      contactName: target.contactName,
      email: target.email,
    };
    if (input.status === "approved") {
      await sendTradeApprovedEmail(payload);
    } else {
      await sendTradeRejectedEmail({ ...payload, note });
    }
  } catch (error) {
    console.error("[trade] 審査結果の通知メールに失敗しました", error);
  }

  revalidatePath("/admin/customers");
  return { ok: true };
}
