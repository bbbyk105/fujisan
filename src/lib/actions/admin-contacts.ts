"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ne } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { contactMessage } from "@/db/contact-schema";
import {
  CONTACT_STATUSES,
  type ContactStatus,
  type ContactSubject,
} from "@/data/fujisan-contact";

export type AdminContactItem = {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  locale: string;
  status: ContactStatus;
  handledByEmail: string | null;
  handledAt: Date | null;
  createdAt: Date;
};

async function requireStaff(): Promise<
  | { ok: true; email: string }
  | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, email: u.email };
}

/** 管理者向け: お問い合わせを新しい順に取得する。 */
export async function adminListContactsAction(input?: {
  /** true なら対応済み（done）を除いて未対応・対応中だけ返す。 */
  openOnly?: boolean;
}): Promise<
  | { ok: true; messages: AdminContactItem[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(contactMessage)
      .where(input?.openOnly ? ne(contactMessage.status, "done") : undefined)
      .orderBy(desc(contactMessage.createdAt))
      .limit(200);

    return {
      ok: true,
      messages: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject as ContactSubject,
        message: row.message,
        locale: row.locale,
        status: row.status as ContactStatus,
        handledByEmail: row.handledByEmail,
        handledAt: row.handledAt ?? null,
        createdAt: row.createdAt,
      })),
    };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 管理者向け: 対応状況を更新する。
 * done に進めた瞬間に、対応した管理者のメールと日時を記録する（監査用）。
 * done から戻した場合はその記録を消す。
 */
export async function adminSetContactStatusAction(input: {
  id: string;
  status: ContactStatus;
}): Promise<
  { ok: true } | { ok: false; error: "unauth" | "forbidden" | "invalid" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.id) return { ok: false, error: "invalid" };
  if (!CONTACT_STATUSES.includes(input.status)) {
    return { ok: false, error: "invalid" };
  }

  try {
    const db = await getDb();
    const done = input.status === "done";
    const updated = await db
      .update(contactMessage)
      .set({
        status: input.status,
        handledByEmail: done ? gate.email : null,
        handledAt: done ? new Date() : null,
      })
      .where(
        and(eq(contactMessage.id, input.id), ne(contactMessage.status, input.status)),
      )
      .returning({ id: contactMessage.id });

    // 更新行ゼロ＝既に同じ状態。二重クリックでもエラーにしない。
    if (updated.length > 0) revalidatePath("/admin/contacts");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
