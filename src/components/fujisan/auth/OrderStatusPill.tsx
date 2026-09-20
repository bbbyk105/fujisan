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
  { cls: string; en: string; ja: string; dot: string }
> = {
  pending: {
    cls: "border-[#0B1A2E]/30 bg-paper text-[#0B1A2E]",
    en: "Received",
    ja: "受付済",
    dot: "bg-[#0B1A2E]/55",
  },
  confirmed: {
    cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/55 text-[#0B1A2E]",
    en: "Confirmed",
    ja: "注文確定",
    dot: "bg-[#C9A84C]",
  },
  preparing: {
    cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/65 text-[#0B1A2E]",
    en: "Preparing",
    ja: "発送準備中",
    dot: "bg-[#C9A84C]",
  },
  shipped: {
    cls: "border-[#5C8A5C]/60 bg-[#5C8A5C]/[0.10] text-[#2F5A2F]",
    en: "Shipped",
    ja: "発送済み",
    dot: "bg-[#5C8A5C]",
  },
  delivered: {
    cls: "border-[#5C8A5C]/70 bg-[#5C8A5C]/[0.16] text-[#2F5A2F]",
    en: "Delivered",
    ja: "お届け済",
    dot: "bg-[#5C8A5C]",
  },
  cancelled: {
    cls: "border-[#8B1A1A]/45 bg-[#8B1A1A]/[0.08] text-[#8B1A1A]",
    en: "Cancelled",
    ja: "キャンセル",
    dot: "bg-[#8B1A1A]",
  },
  refunded: {
    cls: "border-[#8B1A1A]/45 bg-[#8B1A1A]/[0.08] text-[#8B1A1A]",
    en: "Refunded",
    ja: "返金済み",
    dot: "bg-[#8B1A1A]",
  },
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold tracking-[0.26em] ${s.cls}`}
    >
      <span aria-hidden className={`h-[6px] w-[6px] rounded-full ${s.dot}`} />
      <L en={s.en} ja={s.ja} />
    </span>
  );
}
