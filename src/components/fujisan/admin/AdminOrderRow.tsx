"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/db/orders-schema";
import { ORDER_STATUSES } from "@/db/orders-schema";
import { ORDER_STATUS_LABELS } from "@/data/fujisan-orders";
import {
  adminUpdateOrderAction,
  adminRefundOrderAction,
} from "@/lib/actions/admin-orders";

const yen = new Intl.NumberFormat("ja-JP");

/** 表示ラベルは src/data/fujisan-orders.ts が唯一の出どころ。 */
const ORDER_STATUS_LABELS_JA = Object.fromEntries(
  Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => [k, v.ja]),
) as Record<OrderStatus, string>;


/** 手動のステータス変更で選べる値（refunded は返金操作からのみ到達させる）。 */
const SELECTABLE_STATUSES = ORDER_STATUSES.filter((s) => s !== "refunded");

/** 返金ボタンを表示できる（支払い済み・未返金）ステータス。 */
const REFUNDABLE: OrderStatus[] = [
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

const CARRIER_PRESETS = [
  "ヤマト運輸",
  "佐川急便",
  "日本郵便",
  "西濃運輸",
  "福山通運",
];

type Props = {
  order: {
    id: string;
    orderRef: string;
    status: OrderStatus;
    customerName: string;
    customerEmail: string;
    postalCode: string;
    address: string;
    phone: string;
    itemsCount: number;
    total: number;
    trackingCarrier: string | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    refundedAt: Date | null;
    refundedAmount: number | null;
    cancelRequestedAt: Date | null;
    cancelReason: string | null;
    createdAt: Date;
    items: {
      slug: string;
      name: string;
      variant: string;
      ml: number;
      qty: number;
      lineTotal: number;
    }[];
  };
  /** owner のみ返金ボタンを表示する。 */
  canRefund: boolean;
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    // Workers は UTC で動くため、指定しないと JST 00:00〜09:00 が前日になる
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * 管理画面の 1 注文行。
 * - 折りたたみ式: ヘッダーをクリックで詳細＋編集フォームを開閉
 * - フォーム保存で `adminUpdateOrderAction` を呼ぶ → revalidatePath で /admin/orders と /account が更新される
 */
export function AdminOrderRow({ order, canRefund }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [carrier, setCarrier] = useState(order.trackingCarrier ?? "");
  const [number, setNumber] = useState(order.trackingNumber ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  const [refunding, startRefund] = useTransition();

  // 返金の残額。一部返金した注文はここが減っていく。
  const alreadyRefunded = order.refundedAmount ?? 0;
  const remainingRefundable = Math.max(0, order.total - alreadyRefunded);
  const [refundAmount, setRefundAmount] = useState(String(remainingRefundable));

  const dirty =
    status !== order.status ||
    carrier !== (order.trackingCarrier ?? "") ||
    number !== (order.trackingNumber ?? "");

  // owner かつ「支払い済み」で、まだ返せる残額がある注文にだけ返金欄を出す。
  const showRefund =
    canRefund && REFUNDABLE.includes(order.status) && remainingRefundable > 0;

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await adminUpdateOrderAction({
        orderId: order.id,
        status,
        trackingCarrier: carrier,
        trackingNumber: number,
      });
      if (res.ok) {
        setMessage("保存しました");
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage(`保存失敗: ${res.error}`);
      }
    });
  };

  const REFUND_ERRORS: Record<string, string> = {
    unauth: "権限がありません（再ログイン）",
    forbidden: "返金は owner のみ可能です",
    invalid: "注文が見つかりません",
    not_refundable: "この注文は返金できません（未決済/返金済み）",
    amount: "返金額は 1 円以上、残額以下で指定してください",
    config: "Stripe の設定が未完了です",
    stripe: "Stripe 返金に失敗しました",
    db: "返金は成立しましたが記録更新に失敗（要手動確認）",
  };

  /**
   * 返金する。`amount` を省くと残額を全額返す。
   * 全額かどうかで確認文と結果の文面を変える — 一部返金では注文が続くので、
   * 「返金しました」だけだと発送を止めたと誤解されかねない。
   */
  const handleRefund = (amount?: number) => {
    const isFull = amount === undefined || amount >= remainingRefundable;
    const shown = amount ?? remainingRefundable;
    const ok = window.confirm(
      isFull
        ? `注文 ${order.orderRef} の残額すべて（¥${yen.format(shown)}）を返金します。\n注文は「返金済み」になります。この操作は取り消せません。よろしいですか？`
        : `注文 ${order.orderRef} のうち ¥${yen.format(shown)} を返金します。\n注文は進行中のまま（発送は続きます）です。この操作は取り消せません。よろしいですか？`,
    );
    if (!ok) return;
    setRefundMsg(null);
    startRefund(async () => {
      const res = await adminRefundOrderAction({
        orderId: order.id,
        ...(isFull ? {} : { amountJpy: shown }),
      });
      if (res.ok) {
        setRefundMsg(
          res.remaining > 0
            ? `¥${yen.format(shown)} を返金しました（残額 ¥${yen.format(res.remaining)}）。`
            : "全額を返金しました。まもなく一覧に反映されます。",
        );
      } else {
        setRefundMsg(`返金失敗: ${REFUND_ERRORS[res.error] ?? res.error}`);
      }
    });
  };

  return (
    <li className="border border-[#0B1A2E]/12 bg-white">
      {/* Header (toggle) — モバイルはカード状、md 以上はテーブル行 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer border-0 bg-transparent px-5 py-4 text-left hover:bg-paper/60 md:px-6"
      >
        {/* Mobile card */}
        <span className="flex flex-col gap-1.5 md:hidden">
          <span className="flex items-center justify-between gap-3">
            <span className="font-serif text-[13px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              {order.orderRef}
            </span>
            <span className="flex items-center gap-2.5">
              <StatusPill status={order.status} />
              <span aria-hidden className="text-[#0B1A2E]/50">
                {open ? "▾" : "▸"}
              </span>
            </span>
          </span>
          <span className="truncate text-[12px] text-[#0B1A2E]/80">
            {order.customerName}
            <span className="ml-2 text-[#0B1A2E]/45">
              {order.customerEmail}
            </span>
          </span>
          <span className="text-[11.5px] text-[#0B1A2E]/65">
            {fmt(order.createdAt).replace(/\s.+$/, "")} · {order.itemsCount}本 ·
            ¥{yen.format(order.total)}
          </span>
        </span>

        {/* Desktop table row（見出し行と同じカラム幅） */}
        <span className="hidden items-center gap-4 md:grid md:grid-cols-[120px_minmax(0,1fr)_110px_100px_130px_24px]">
          <span className="font-serif text-[13px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            {order.orderRef}
          </span>
          <span className="min-w-0 truncate text-[12px] text-[#0B1A2E]/80">
            {order.customerName}
            <span className="ml-2 text-[#0B1A2E]/45">
              {order.customerEmail}
            </span>
          </span>
          <span className="text-[11.5px] text-[#0B1A2E]/65">
            {fmt(order.createdAt).replace(/\s.+$/, "")}
          </span>
          <span className="text-right font-serif text-[13px] tracking-[0.02em] text-[#0B1A2E]">
            ¥{yen.format(order.total)}
          </span>
          <StatusPill status={order.status} />
          <span aria-hidden className="text-[#0B1A2E]/50">
            {open ? "▾" : "▸"}
          </span>
        </span>
      </button>

      {/*
        キャンセル依頼は畳んでいても見える位置に出す。
        発送を止める判断が要るので、行を開かないと気づけないのでは遅い。
      */}
      {order.cancelRequestedAt && order.status !== "refunded" && (
        <p className="border-t border-crimson/25 bg-crimson/[0.06] px-6 py-3 text-[12px] leading-[1.7] text-crimson">
          <strong className="font-semibold">
            キャンセル依頼あり（{fmt(order.cancelRequestedAt)}）
          </strong>
          {order.cancelReason ? ` — ${order.cancelReason}` : "（理由の記入なし）"}
          <br />
          発送を止めたうえで、下の「返金」から全額返金してください。
        </p>
      )}

      {!open ? null : (
        <div className="border-t border-[#0B1A2E]/10 px-6 py-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left: customer & items */}
            <div className="flex flex-col gap-5">
              <Section title="お届け先">
                <p className="text-[12.5px] leading-[1.7] text-[#0B1A2E]/82">
                  〒{order.postalCode}
                  <br />
                  {order.address}
                  <br />
                  {order.customerName} ／ {order.phone}
                </p>
              </Section>

              <Section title={`商品 (${order.itemsCount}本)`}>
                <ul className="flex flex-col gap-1.5 text-[12.5px] text-[#0B1A2E]/85">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        {it.name} {it.variant}
                        <span className="text-[#0B1A2E]/55">
                          {" "}
                          · {it.ml}ml × {it.qty}
                        </span>
                      </span>
                      <span>¥{yen.format(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="ご注文情報">
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-[#0B1A2E]/75">
                  <li>注文日時:</li>
                  <li>{fmt(order.createdAt)}</li>
                  {order.shippedAt && (
                    <>
                      <li>発送日時:</li>
                      <li>{fmt(order.shippedAt)}</li>
                    </>
                  )}
                  {order.deliveredAt && (
                    <>
                      <li>お届け日時:</li>
                      <li>{fmt(order.deliveredAt)}</li>
                    </>
                  )}
                  {order.refundedAt && (
                    <>
                      <li className="text-crimson">返金日時:</li>
                      <li className="text-crimson">{fmt(order.refundedAt)}</li>
                    </>
                  )}
                </ul>
              </Section>
            </div>

            {/* Right: edit form */}
            <div className="flex flex-col gap-5">
              <Section title="ステータス">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full border border-[#0B1A2E]/25 bg-white px-3 py-2.5 text-[13px] text-[#0B1A2E] outline-none focus:border-[#C9A84C]"
                >
                  {SELECTABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS_JA[s]}（{s}）
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] leading-[1.6] text-[#0B1A2E]/55">
                  「発送済み」「お届け済」に進めると発送日・お届け日が自動で記録されます。
                </p>
              </Section>

              <Section title="配送会社">
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  list={`carriers-${order.id}`}
                  placeholder="ヤマト運輸 / 佐川 / 日本郵便"
                  className="w-full border border-[#0B1A2E]/25 bg-white px-3 py-2.5 text-[13px] text-[#0B1A2E] outline-none focus:border-[#C9A84C]"
                />
                <datalist id={`carriers-${order.id}`}>
                  {CARRIER_PRESETS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Section>

              <Section title="追跡番号">
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="例) 1234-5678-9012"
                  className="w-full border border-[#0B1A2E]/25 bg-white px-3 py-2.5 text-[13px] text-[#0B1A2E] outline-none focus:border-[#C9A84C]"
                />
              </Section>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || pending}
                  className="inline-flex cursor-pointer items-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-3 text-[11px] font-semibold tracking-[0.26em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "保存中…" : "保存"}
                </button>
                <a
                  href={`/admin/orders/${order.orderRef}/packing-slip`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[#0B1A2E]/30 px-5 py-3 text-[10.5px] font-semibold tracking-[0.22em] text-[#0B1A2E] no-underline transition-colors hover:border-[#0B1A2E]"
                >
                  納品書を印刷
                </a>
                {message && (
                  <span
                    className={`text-[11.5px] ${
                      message.startsWith("保存失敗")
                        ? "text-[#8B1A1A]"
                        : "text-[#2F5A2F]"
                    }`}
                  >
                    {message}
                  </span>
                )}
              </div>

              {/* 返金（owner のみ・支払い済み注文のみ）。破損・誤配送などの実務対応。 */}
              {showRefund && (
                <div className="mt-3 border-t border-crimson/15 pt-5">
                  <p className="text-[10px] font-semibold tracking-[0.3em] text-crimson/80">
                    返金
                  </p>
                  {alreadyRefunded > 0 && (
                    <p className="mt-2 text-[11.5px] font-semibold text-crimson">
                      返金済み ¥{yen.format(alreadyRefunded)} / 残額 ¥
                      {yen.format(remainingRefundable)}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] leading-[1.6] text-[#0B1A2E]/60">
                    Stripe 経由で返金し、お客様へ返金メールを送ります。取り消せません。
                    一部だけ返した場合、注文は進行中のまま（発送は続きます）で、
                    <strong className="font-semibold">在庫は自動では戻りません</strong>。
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRefund()}
                      disabled={refunding}
                      className="inline-flex cursor-pointer items-center gap-2 border border-crimson bg-transparent px-5 py-3 text-[11px] font-semibold tracking-[0.22em] text-crimson transition-colors hover:bg-crimson hover:text-paper-card disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {refunding
                        ? "返金処理中…"
                        : `全額返金（¥${yen.format(remainingRefundable)}）`}
                    </button>

                    <span className="text-[11px] text-[#0B1A2E]/45">または</span>

                    <label
                      htmlFor={`refund-amount-${order.id}`}
                      className="sr-only"
                    >
                      返金する金額（円）
                    </label>
                    <input
                      id={`refund-amount-${order.id}`}
                      type="number"
                      min={1}
                      max={remainingRefundable}
                      step={1}
                      inputMode="numeric"
                      value={refundAmount}
                      disabled={refunding}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-28 border border-[#0B1A2E]/25 bg-white px-3 py-2.5 text-right text-[12.5px] tabular-nums text-[#0B1A2E] outline-none focus:border-crimson disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = Number(refundAmount.trim());
                        if (!Number.isInteger(n) || n < 1) {
                          setRefundMsg("返金失敗: 金額は 1 円以上の整数で入力してください");
                          return;
                        }
                        if (n > remainingRefundable) {
                          setRefundMsg("返金失敗: 残額を超える金額は返金できません");
                          return;
                        }
                        handleRefund(n);
                      }}
                      disabled={refunding}
                      className="cursor-pointer border border-[#0B1A2E]/30 bg-transparent px-4 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-[#0B1A2E] transition-colors hover:border-[#0B1A2E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      この額を返金
                    </button>
                  </div>

                  {refundMsg && (
                    <p
                      className={`mt-3 text-[11.5px] leading-normal ${
                        refundMsg.startsWith("返金失敗")
                          ? "text-crimson"
                          : "text-[#2F5A2F]"
                      }`}
                    >
                      {refundMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/55">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const STYLES: Record<OrderStatus, { cls: string; dot: string }> = {
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
      cls: "border-[#8B1A1A]/55 bg-[#8B1A1A]/[0.12] text-[#8B1A1A]",
      dot: "bg-[#8B1A1A]",
    },
  };
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 border px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.22em] ${s.cls}`}
    >
      <span aria-hidden className={`h-[5px] w-[5px] rounded-full ${s.dot}`} />
      {ORDER_STATUS_LABELS_JA[status]}
    </span>
  );
}
