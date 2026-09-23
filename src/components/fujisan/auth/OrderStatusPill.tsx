import { ORDER_STATUS_LABELS } from "@/data/fujisan-orders";
import { L } from "@/i18n/Localized";
import type { OrderStatus } from "@/db/orders-schema";

/**
 * 注文ステータスのバッジ。
 *
 * ORDER_STATUSES の全値を網羅すること（Record<OrderStatus, …> で型が強制する）。
 * 以前はアカウント画面にベタ書きされていて `refunded` が抜けており、
 * 返金済みの注文が「受付済」と表示されていた。
 */
const STYLES: Record<
  OrderStatus,
  { cls: string; dot: string }
> = {
  pending: {
    cls: "border-[#0B1A2E]/30 bg-paper text-[#0B1A2E]",
    dot: "bg-[#0B1A2E]/55",
  },
  confirmed: {
    cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/55 text-[#0B1A2E]",
    dot: "bg-[#C9A84C]",
  },
  preparing: {
    cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/65 text-[#0B1A2E]",
    dot: "bg-[#C9A84C]",
  },
  shipped: {
    cls: "border-[#5C8A5C]/60 bg-[#5C8A5C]/[0.10] text-[#2F5A2F]",
    dot: "bg-[#5C8A5C]",
  },
  delivered: {
    cls: "border-[#5C8A5C]/70 bg-[#5C8A5C]/[0.16] text-[#2F5A2F]",
    dot: "bg-[#5C8A5C]",
  },
  cancelled: {
    cls: "border-[#8B1A1A]/45 bg-[#8B1A1A]/[0.08] text-[#8B1A1A]",
    dot: "bg-[#8B1A1A]",
  },
  refunded: {
    cls: "border-[#8B1A1A]/45 bg-[#8B1A1A]/[0.08] text-[#8B1A1A]",
    dot: "bg-[#8B1A1A]",
  },
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const s = STYLES[status] ?? STYLES.pending;
  // 見た目はここ、文言は src/data/fujisan-orders.ts。同じ状態を指す言葉が
  // 画面ごとに違うと、お客様と蔵の会話が噛み合わなくなる。
  const label = ORDER_STATUS_LABELS[status] ?? ORDER_STATUS_LABELS.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold tracking-[0.26em] ${s.cls}`}
    >
      <span aria-hidden className={`h-[6px] w-[6px] rounded-full ${s.dot}`} />
      <L en={label.en} ja={label.ja} />
    </span>
  );
}
