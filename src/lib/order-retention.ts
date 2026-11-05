import { and, isNull, lt, ne, or } from "drizzle-orm";
import { getDb } from "@/db";
import { contactMessage } from "@/db/contact-schema";
import { order as orderTable } from "@/db/orders-schema";
import { CONTACT_RETENTION_YEARS } from "@/data/fujisan-contact";
import { ORDER_PII_RETENTION_YEARS } from "@/data/fujisan-orders";

/** `now` から `years` 年前の時点。 */
function yearsBefore(now: Date, years: number): Date {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(now.getUTCFullYear() - years);
  return cutoff;
}

/**
 * 保存期間を過ぎた、アカウントの無い注文（退会者とゲスト購入）から、個人を特定できる
 * 情報を消す。消した件数を返す。
 *
 * 金額・品目・日付・注文番号は税務の記録として残す。Stripe の ID も消す — Stripe 側に
 * 氏名や住所が残っているので、ID があるとそこへたどれてしまう。
 * 会員の注文は対象にしない（アカウントの利用中は保有するとポリシーに書いている）。
 *
 * 失敗しても投げない。次の掃除でやり直せる。
 */
export async function anonymizeExpiredOrders(now = new Date()): Promise<number> {
  try {
    const db = await getDb();
    const anonymized = await db
      .update(orderTable)
      .set({
        customerName: "",
        customerEmail: "",
        postalCode: "",
        address: "",
        phone: "",
        receiptAddressee: null,
        cancelReason: null,
        trackingNumber: null,
        stripeSessionId: null,
        stripePaymentIntentId: null,
        stripeRefundId: null,
      })
      .where(
        and(
          isNull(orderTable.userId),
          lt(orderTable.createdAt, yearsBefore(now, ORDER_PII_RETENTION_YEARS)),
          // 消し終えた行を毎回書き直さない。1 列だけで判定すると、その列が空の行を消し漏らす
          or(
            ne(orderTable.customerName, ""),
            ne(orderTable.customerEmail, ""),
            ne(orderTable.postalCode, ""),
            ne(orderTable.address, ""),
            ne(orderTable.phone, ""),
          ),
        ),
      )
      .returning({ id: orderTable.id });
    return anonymized.length;
  } catch (err) {
    console.error("[retention] 注文の個人情報を消せませんでした:", err);
    return 0;
  }
}

/** 保存期間を過ぎたお問い合わせを消す。消した件数を返す。失敗しても投げない。 */
export async function deleteExpiredContacts(now = new Date()): Promise<number> {
  try {
    const db = await getDb();
    const deleted = await db
      .delete(contactMessage)
      .where(
        lt(contactMessage.createdAt, yearsBefore(now, CONTACT_RETENTION_YEARS)),
      )
      .returning({ id: contactMessage.id });
    return deleted.length;
  } catch (err) {
    console.error("[retention] お問い合わせを消せませんでした:", err);
    return 0;
  }
}

/**
 * プライバシーポリシーの保有期間を守るための掃除。
 *
 * Cron ではなく管理画面のトップから呼ぶ。注文の対象が出るのは早くても 2035 年で、
 * そのためにデプロイの構成を変えるほどではなく、日単位の精度も要らない。
 * 取り消せない削除なので、消した件数は記録に残す。
 */
export async function sweepExpiredPersonalData(now = new Date()): Promise<void> {
  const orders = await anonymizeExpiredOrders(now);
  const contacts = await deleteExpiredContacts(now);
  if (orders > 0 || contacts > 0) {
    console.info(`[retention] 注文 ${orders} 件を匿名化、お問い合わせ ${contacts} 件を削除`);
  }
}
