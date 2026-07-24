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
  postalCode?: string;
  address?: string;
};

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: "unauth" | "invalid" | "postal" | "db" };

/**
 * ログイン中ユーザー自身の登録情報を更新する。
 * 電話・郵便番号・住所は個人／法人ともに更新可（注文時のお届け先に使う）。
 * 会社名は法人のみ。空文字は null として保存する。
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

  // 郵便番号はハイフン等を除いた7桁に正規化して保存。入力があるのに7桁でなければエラー。
  const postalRaw = (input.postalCode ?? "").replace(/[^0-9]/g, "");
  if ((input.postalCode ?? "").trim().length > 0 && !/^\d{7}$/.test(postalRaw)) {
    return { ok: false, error: "postal" };
  }
  const postalCode = postalRaw.length === 7 ? postalRaw : null;

  try {
    const db = await getDb();
    await db
      .update(userTable)
      .set({
        name,
        phone: clean(input.phone),
        postalCode,
        address: clean(input.address),
        // 会社名は法人のみ更新（個人は触らない＝既存値を保持）
        ...(isBusiness ? { companyName: clean(input.companyName) } : {}),
      })
      .where(eq(userTable.id, u.id));

    revalidatePath("/account");
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
