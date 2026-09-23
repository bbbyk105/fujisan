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
 * 領収書の宛名の上限（文字数）。
 *
 * 長すぎると印刷時に行が折り返して書面の体裁が崩れる。
 * `"use server"` のファイルは async 関数以外を export できないため、
 * Server Action と UI の両方から読めるようにここへ置く。
 */
export const RECEIPT_ADDRESSEE_MAX = 60;
