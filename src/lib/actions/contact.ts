"use server";

import { headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { contactMessage } from "@/db/contact-schema";
import {
  CONTACT_SUBJECTS,
  type ContactSubject,
} from "@/data/fujisan-contact";
import { getFieldErrors, contactSchema } from "@/lib/validation/forms";
import {
  sendContactAdminNotification,
  sendContactAcknowledgement,
} from "@/lib/emails/contact-emails";

/** 同一 IP からこの時間内に */
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** この件数を超えて送られたら弾く */
const RATE_MAX_IN_WINDOW = 5;

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "rate" | "db" };

export type ContactActionInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: "ja" | "en";
  /**
   * ハニーポット。人間には見えない入力欄で、値が入っていれば bot と判断する。
   * クライアントからは常に送られてくる（通常は空文字）。
   */
  website?: string;
};

/** 送信元 IP を SHA-256 で伏せる（生 IP は保存しない）。 */
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/**
 * お問い合わせを受け付ける。
 *
 * 受領の正は D1（contact_message）。**まず保存してからメールを送る**ので、
 * Resend が落ちていても問い合わせは失われず /admin/contacts から拾える。
 * 逆に DB 保存に失敗したときだけ、お客様にエラーを返す。
 */
export async function submitContactAction(
  input: ContactActionInput,
): Promise<ContactActionResult> {
  // ハニーポットに値が入っていれば bot。成功を装って静かに捨てる
  // （失敗を返すと bot 側が入力を変えて再試行するため）。
  if ((input.website ?? "").trim().length > 0) return { ok: true };

  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const subject = input.subject.trim();
  const locale: "ja" | "en" = input.locale === "en" ? "en" : "ja";

  // クライアントと同じスキーマでサーバー側でも検証する（UI を迂回した送信対策）。
  if (Object.keys(getFieldErrors(contactSchema, { name, email, subject, message })).length > 0) {
    return { ok: false, error: "invalid" };
  }
  // 用件は既知のコードのみ受け付ける（select の改ざん対策）。
  if (!CONTACT_SUBJECTS.includes(subject as ContactSubject)) {
    return { ok: false, error: "invalid" };
  }

  const h = await headers();
  const rawIp =
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  const ipHash = rawIp ? await hashIp(rawIp) : null;

  const id = crypto.randomUUID();
  try {
    const db = await getDb();

    // 連投チェック。IP が取れない環境ではスキップする（誤遮断を避ける）。
    if (ipHash) {
      const since = new Date(Date.now() - RATE_WINDOW_MS);
      const recent = await db
        .select({ id: contactMessage.id })
        .from(contactMessage)
        .where(
          and(
            eq(contactMessage.ipHash, ipHash),
            gt(contactMessage.createdAt, since),
          ),
        )
        .limit(RATE_MAX_IN_WINDOW);
      if (recent.length >= RATE_MAX_IN_WINDOW) {
        return { ok: false, error: "rate" };
      }
    }

    await db.insert(contactMessage).values({
      id,
      name,
      email,
      subject,
      message,
      locale,
      status: "new",
      ipHash,
    });
  } catch {
    return { ok: false, error: "db" };
  }

  // メールはベストエフォート。ここで失敗してもお客様には成功を返す
  // （受領は DB に残っており、管理画面から対応できる）。
  const notification = {
    id,
    name,
    email,
    subject: subject as ContactSubject,
    message,
    locale,
  };
  try {
    await sendContactAdminNotification(notification);
  } catch (err) {
    console.error("[contact] 管理者通知メールの送信に失敗:", err);
  }
  try {
    await sendContactAcknowledgement(notification);
  } catch (err) {
    console.error("[contact] 自動受領確認メールの送信に失敗:", err);
  }

  return { ok: true };
}
