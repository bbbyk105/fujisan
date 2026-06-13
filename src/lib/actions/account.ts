"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";

export type ProfileInput = {
  name: string;
  companyName?: string;
  phone?: string;
  address?: string;
};

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: "unauth" | "invalid" | "db" };

/**
 * ログイン中ユーザー自身の登録情報を更新する。
 * 法人は会社名・電話・所在地も更新可。空文字は null として保存する。
 */
export async function updateMyProfileAction(
  input: ProfileInput,
): Promise<ProfileResult> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id) return { ok: false, error: "unauth" };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "invalid" };

  const isBusiness = u.role === "business";
  const clean = (v?: string) => {
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };

  try {
    const db = await getDb();
    await db
      .update(userTable)
      .set({
        name,
        // 法人のみ会社情報を更新（個人は触らない＝既存値を保持）
        ...(isBusiness
          ? {
              companyName: clean(input.companyName),
              phone: clean(input.phone),
              address: clean(input.address),
            }
          : {}),
      })
      .where(eq(userTable.id, u.id));

    revalidatePath("/account");
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
