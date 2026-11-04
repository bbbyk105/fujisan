import type { OrderStatus } from "@/db/orders-schema";

/**
 * 注文ステータスの表示ラベル（唯一の出どころ）。
 *
 * 以前は管理画面・ダッシュボード・顧客向けピルの 3 か所に同じ対応表が
 * 書かれていて、ステータスを足したときに直し漏れる形になっていた。
 *
 * `Record<OrderStatus, …>` なので、`ORDER_STATUSES` に値を足すと
 * ここが型エラーになる — 漏れがコンパイル時に分かる。
 *
 * サーバー専用の依存を持たせないこと（クライアントからも読むため）。
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, { ja: string; en: string }> = {
  pending: { ja: "受付済", en: "Received" },
  confirmed: { ja: "注文確定", en: "Confirmed" },
  preparing: { ja: "発送準備中", en: "Preparing" },
  shipped: { ja: "発送済み", en: "Shipped" },
  delivered: { ja: "お届け済", en: "Delivered" },
  cancelled: { ja: "キャンセル", en: "Cancelled" },
  refunded: { ja: "返金済み", en: "Refunded" },
};

/** 日本語ラベルだけが要る場面（CSV・管理画面）向けの近道。 */
export function orderStatusJp(status: OrderStatus | string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus]?.ja ?? status;
}

/**
 * 退会したお客様の注文で、個人情報を持ち続ける年数（注文日から）。
 *
 * 法人税と消費税の保存期間は 7 年だが、申告期限の後から数えるので、取引日からは
 * 最長で約 8 年 3 か月になる。それを満たす 9 年にしている。会社法の会計帳簿の
 * 10 年は、金額の記録を残すことで満たす想定（年数は税理士の確認で見直してよい）。
 * プライバシーポリシーの文面もこの値を読むので、変えると公開の約束も変わる。
 */
export const ORDER_PII_RETENTION_YEARS = 9;
