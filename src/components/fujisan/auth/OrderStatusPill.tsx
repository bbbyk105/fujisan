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
 * 丸ドット付きのピルにはしない。状態は色のついた短い罫と文字で足りる。
 */
const STYLES: Record<OrderStatus, string> = {
  pending: "border-indigo/35 text-indigo/70",
  confirmed: "border-gold text-indigo",
  preparing: "border-gold text-indigo",
  shipped: "border-moss text-moss",
  delivered: "border-moss text-moss",
  cancelled: "border-crimson text-crimson",
  refunded: "border-crimson text-crimson",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const cls = STYLES[status] ?? STYLES.pending;
  // 見た目はここ、文言は src/data/fujisan-orders.ts。同じ状態を指す言葉が
  // 画面ごとに違うと、お客様と蔵の会話が噛み合わなくなる。
  const label = ORDER_STATUS_LABELS[status] ?? ORDER_STATUS_LABELS.pending;
  return (
    <span
      className={`inline-flex shrink-0 items-center border-l-2 pl-3 text-[12px] font-semibold tracking-[0.08em] ${cls}`}
    >
      <L en={label.en} ja={label.ja} />
    </span>
  );
}
