"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/db/orders-schema";
import { ORDER_STATUSES } from "@/db/orders-schema";
import {
  adminUpdateOrderAction,
  adminRefundOrderAction,
} from "@/lib/actions/admin-orders";

const yen = new Intl.NumberFormat("ja-JP");

const STATUS_LABELS_JA: Record<OrderStatus, string> = {
  pending: "受付済",
  confirmed: "注文確定",
  preparing: "蔵で準備中",
  shipped: "発送済み",
  delivered: "お届け済",
  cancelled: "キャンセル",
  refunded: "返金済み",
};

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

  const dirty =
    status !== order.status ||
    carrier !== (order.trackingCarrier ?? "") ||
    number !== (order.trackingNumber ?? "");

  // owner かつ「支払い済み・未返金」の注文にのみ返金ボタンを出す。
  const showRefund = canRefund && REFUNDABLE.includes(order.status);

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
    config: "Stripe の設定が未完了です",
    stripe: "Stripe 返金に失敗しました",
    db: "返金は成立しましたが記録更新に失敗（要手動確認）",
  };

  const handleRefund = () => {
    const ok = window.confirm(
      `注文 ${order.orderRef} を全額（¥${yen.format(order.total)}）返金します。\nこの操作は取り消せません。よろしいですか？`,
    );
    if (!ok) return;
    setRefundMsg(null);
    startRefund(async () => {
      const res = await adminRefundOrderAction({ orderId: order.id });
      if (res.ok) {
        setRefundMsg("返金しました。まもなく一覧に反映されます。");
      } else {
        setRefundMsg(`返金失敗: ${REFUND_ERRORS[res.error] ?? res.error}`);
      }
    });
  };

  return (
    <li className="border border-[#0B1A2E]/12 bg-white">
      {/* Header (toggle) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid w-full cursor-pointer grid-cols-[120px_1fr_120px_100px_120px_28px] items-center gap-4 border-0 bg-transparent px-6 py-4 text-left hover:bg-paper/60"
      >
        <span className="font-serif text-[13px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          {order.orderRef}
        </span>
        <span className="text-[12px] text-[#0B1A2E]/80">
          {order.customerName}
          <span className="ml-2 text-[#0B1A2E]/45">{order.customerEmail}</span>
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
      </button>

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
                      {STATUS_LABELS_JA[s]}（{s}）
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
                  <p className="mt-2 text-[11px] leading-[1.6] text-[#0B1A2E]/60">
                    Stripe 経由で全額（¥{yen.format(order.total)}
                    ）を返金し、お客様へ返金メールを送ります。取り消せません。
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={refunding}
                      className="inline-flex cursor-pointer items-center gap-2 border border-crimson bg-transparent px-5 py-3 text-[11px] font-semibold tracking-[0.22em] text-crimson transition-colors hover:bg-crimson hover:text-paper-card disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {refunding
                        ? "返金処理中…"
                        : `全額返金（¥${yen.format(order.total)}）`}
                    </button>
                    {refundMsg && (
                      <span
                        className={`text-[11.5px] leading-normal ${
                          refundMsg.startsWith("返金失敗")
                            ? "text-crimson"
                            : "text-[#2F5A2F]"
                        }`}
                      >
                        {refundMsg}
                      </span>
                    )}
                  </div>
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
      {STATUS_LABELS_JA[status]}
    </span>
  );
}
