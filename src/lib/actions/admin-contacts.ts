"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { contactMessage, contactReply } from "@/db/contact-schema";
import {
  CONTACT_LIST_LIMIT,
  CONTACT_REPLY_MAX,
  CONTACT_STATUSES,
  type ContactStatus,
  type ContactSubject,
} from "@/data/fujisan-contact";
import { sendContactReply } from "@/lib/emails/contact-emails";
import { alertOps } from "@/lib/ops-alert";

export type AdminContactReplyItem = {
  id: string;
  body: string;
  sentByEmail: string;
  createdAt: Date;
};

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
  /** 送信した返信。古い順。 */
  replies: AdminContactReplyItem[];
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
    const listed = input?.openOnly ? ne(contactMessage.status, "done") : undefined;
    const [rows, tallies, replies] = await Promise.all([
      db
        .select()
        .from(contactMessage)
        .where(listed)
        .orderBy(desc(contactMessage.createdAt))
        .limit(CONTACT_LIST_LIMIT),
      db
        .select({ status: contactMessage.status, n: count() })
        .from(contactMessage)
        .groupBy(contactMessage.status),
      // id を並べて渡さず副問い合わせにする。D1 は 1 文のバインド数が 100 までで、
      // 一覧の上限（200 件）を渡すと失敗する。
      db
        .select()
        .from(contactReply)
        .where(
          inArray(
            contactReply.contactId,
            db
              .select({ id: contactMessage.id })
              .from(contactMessage)
              .where(listed)
              .orderBy(desc(contactMessage.createdAt))
              .limit(CONTACT_LIST_LIMIT),
          ),
        )
        .orderBy(asc(contactReply.createdAt)),
    ]);
    const repliesByContact = new Map<string, AdminContactReplyItem[]>();
    for (const { contactId, id, body, sentByEmail, createdAt } of replies) {
      const list = repliesByContact.get(contactId) ?? [];
      list.push({ id, body, sentByEmail, createdAt });
      repliesByContact.set(contactId, list);
    }

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
        replies: repliesByContact.get(row.id) ?? [],
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

/**
 * 管理者向け: お客様へ返信を送り、記録する。未対応なら対応中にする。
 *
 * 宛先は入力で受け取らず、D1 の問い合わせから引く（Server Action は直接呼べる）。
 * 画面が読んだ返信の数（expectedReplies）と比べ、ずれていたら送らない。開いたままの
 * 画面から送ると、ほかの管理者の返信に気づかないまま 2 通届いてしまう。
 *
 * **送ってから記録する。** 逆にすると、送れなかったのに「送信済み」の記録が残る
 * 時間ができる。記録だけに失敗したときはお客様に届いているので成功として返し、
 * 同じ返信を送り直されないよう `recorded: false` で伝えて、人にも知らせる。
 */
export async function adminReplyContactAction(input: {
  id: string;
  body: string;
  expectedReplies: number;
}): Promise<
  | { ok: true; recorded: boolean }
  | {
      ok: false;
      error:
        | "unauth"
        | "forbidden"
        | "invalid"
        | "gone"
        | "conflict"
        | "send"
        | "db";
    }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!input.id || !body || body.length > CONTACT_REPLY_MAX) {
    return { ok: false, error: "invalid" };
  }

  let db: Awaited<ReturnType<typeof getDb>>;
  let row: typeof contactMessage.$inferSelect | undefined;
  let replyCount: number;
  try {
    db = await getDb();
    [row] = await db
      .select()
      .from(contactMessage)
      .where(eq(contactMessage.id, input.id))
      .limit(1);
    [{ n: replyCount }] = await db
      .select({ n: count() })
      .from(contactReply)
      .where(eq(contactReply.contactId, input.id));
  } catch {
    return { ok: false, error: "db" };
  }
  if (!row) return { ok: false, error: "gone" };
  if (replyCount !== input.expectedReplies) {
    revalidatePath("/admin/contacts");
    return { ok: false, error: "conflict" };
  }

  try {
    await sendContactReply({
      name: row.name,
      email: row.email,
      subject: row.subject as ContactSubject,
      message: row.message,
      locale: row.locale === "en" ? "en" : "ja",
      reply: body,
    });
  } catch (err) {
    console.error("[contact] 返信を送信できませんでした:", err);
    return { ok: false, error: "send" };
  }

  try {
    await db.insert(contactReply).values({
      id: crypto.randomUUID(),
      contactId: row.id,
      body,
      sentByEmail: gate.email,
    });
  } catch (err) {
    console.error("[contact] 返信を記録できませんでした:", err);
    await alertOps(
      "お問い合わせの返信を記録できませんでした",
      `お客様へは送信済みですが、管理画面に記録されていません。\nお問い合わせ: ${row.id}\n送信者: ${gate.email}`,
    );
    revalidatePath("/admin/contacts");
    return { ok: true, recorded: false };
  }

  // 返信は記録できているので、ここの失敗は報告しない（画面で直せる）。
  try {
    await db
      .update(contactMessage)
      .set({ status: "in_progress" })
      .where(
        and(eq(contactMessage.id, row.id), eq(contactMessage.status, "new")),
      );
  } catch (err) {
    console.error("[contact] 対応状況を更新できませんでした:", err);
  }

  revalidatePath("/admin/contacts");
  return { ok: true, recorded: true };
}
