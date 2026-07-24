import { L } from "@/i18n/Localized";
import type { OrderStatus } from "@/db/orders-schema";

type Step = { key: OrderStatus; en: string; ja: string };

/** 配送進行のメインステップ。cancelled はタイムラインに含めない（別表示で対応）。 */
const STEPS: Step[] = [
  { key: "pending", en: "Received", ja: "受付済" },
  { key: "confirmed", en: "Confirmed", ja: "注文確定" },
  { key: "preparing", en: "Preparing", ja: "発送準備中" },
  { key: "shipped", en: "Shipped", ja: "発送済み" },
  { key: "delivered", en: "Delivered", ja: "お届け済" },
];

/**
 * 注文進行を 5 ステップの水平タイムラインで表す。
 * - 現在のステータスまでのドットを金色（完了済）に塗る
 * - 接続線も完了部分だけ色を変える
 * - cancelled の時は専用の注意ボックスを上に出す
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="border border-[#8B1A1A]/30 bg-[#8B1A1A]/[0.06] px-5 py-4 text-[12px] leading-[1.7] text-[#8B1A1A]">
        <L
          en="This order has been cancelled. Contact us if you need help."
          ja="このご注文はキャンセルされました。ご不明な点はお問い合わせください。"
        />
      </div>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.key === status);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <ol className="grid grid-cols-5 gap-0">
      {STEPS.map((step, i) => {
        const reached = i <= safeIndex;
        const isCurrent = i === safeIndex;
        const segReached = i < safeIndex; // この点と次の点の間の線

        return (
          <li key={step.key} className="relative flex flex-col items-center">
            {/* Connector line (right side of dot, except last) */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-1/2 top-[7px] h-px w-full transition-colors duration-500 ${
                  segReached ? "bg-[#C9A84C]" : "bg-[#0B1A2E]/15"
                }`}
              />
            )}

            {/* Dot */}
            <span
              aria-hidden
              className={`relative z-10 block h-[14px] w-[14px] rounded-full border transition-all duration-500 ${
                reached
                  ? isCurrent
                    ? "border-[#C9A84C] bg-[#C9A84C] ring-4 ring-[#C9A84C]/25"
                    : "border-[#C9A84C] bg-[#C9A84C]"
                  : "border-[#0B1A2E]/20 bg-paper"
              }`}
            />

            <span
              className={`mt-3 text-center text-[10px] font-semibold tracking-[0.2em] transition-colors ${
                reached ? "text-[#0B1A2E]" : "text-[#0B1A2E]/45"
              }`}
            >
              <L en={step.en} ja={step.ja} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
