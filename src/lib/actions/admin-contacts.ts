"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { contactMessage } from "@/db/contact-schema";
import {
  CONTACT_LIST_LIMIT,
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
  | {
      ok: true;
      messages: AdminContactItem[];
      /** 全件の集計。messages は上限で切られるので、そこから数えない。 */
      counts: { new: number; inProgress: number };
    }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const [rows, tallies] = await Promise.all([
      db
        .select()
        .from(contactMessage)
        .where(input?.openOnly ? ne(contactMessage.status, "done") : undefined)
        .orderBy(desc(contactMessage.createdAt))
        .limit(CONTACT_LIST_LIMIT),
      db
        .select({ status: contactMessage.status, n: count() })
        .from(contactMessage)
        .groupBy(contactMessage.status),
    ]);
    const tally = (status: ContactStatus) =>
      tallies.find((t) => t.status === status)?.n ?? 0;

    return {
      ok: true,
      counts: { new: tally("new"), inProgress: tally("in_progress") },
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
 *
 * 読んだときの状況（expectedStatus）を WHERE に入れる。古い画面から保存すると、
 * ほかの管理者の更新と対応者の記録を消してしまうので、そのときは `conflict` を返す。
 */
export async function adminSetContactStatusAction(input: {
  id: string;
  status: ContactStatus;
  expectedStatus: ContactStatus;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      error: "unauth" | "forbidden" | "invalid" | "conflict" | "db";
    }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.id) return { ok: false, error: "invalid" };
  if (
    !CONTACT_STATUSES.includes(input.status) ||
    !CONTACT_STATUSES.includes(input.expectedStatus)
  ) {
    return { ok: false, error: "invalid" };
  }
  if (input.status === input.expectedStatus) return { ok: true };

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
        and(
          eq(contactMessage.id, input.id),
          eq(contactMessage.status, input.expectedStatus),
        ),
      )
      .returning({ id: contactMessage.id });

    // 更新できなかったときは画面が古いので、そのときも読み直す。
    revalidatePath("/admin/contacts");
    return updated.length > 0 ? { ok: true } : { ok: false, error: "conflict" };
  } catch {
    return { ok: false, error: "db" };
  }
}
