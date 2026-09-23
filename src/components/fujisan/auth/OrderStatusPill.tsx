import { ORDER_STATUS_LABELS } from "@/data/fujisan-orders";
import { L } from "@/i18n/Localized";
import type { OrderStatus } from "@/db/orders-schema";

/**
 * 注文ステータスの表示。
 *
 * ORDER_STATUSES の全値を網羅すること（Record<OrderStatus, …> で型が強制する）。
 * 以前はアカウント画面にベタ書きされていて `refunded` が抜けており、
 * 返金済みの注文が「受付済」と表示されていた。
 *
 * ピルにも、左に帯を立てた形にもしない。状態は文字の色だけで足りる。
 */
const STYLES: Record<OrderStatus, string> = {
  pending: "text-indigo/60",
  confirmed: "text-gold-ink",
  preparing: "text-gold-ink",
  shipped: "text-moss",
  delivered: "text-moss",
  cancelled: "text-crimson",
  refunded: "text-crimson",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const cls = STYLES[status] ?? STYLES.pending;
  // 見た目はここ、文言は src/data/fujisan-orders.ts。同じ状態を指す言葉が
  // 画面ごとに違うと、お客様と蔵の会話が噛み合わなくなる。
  const label = ORDER_STATUS_LABELS[status] ?? ORDER_STATUS_LABELS.pending;
  return (
    <span
      className={`inline-flex shrink-0 items-center text-[12.5px] font-semibold tracking-[0.08em] ${cls}`}
    >
      <L en={label.en} ja={label.ja} />
    </span>
  );
}
