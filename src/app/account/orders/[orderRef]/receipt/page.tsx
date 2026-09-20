import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/fujisan/auth/PrintButton";
import { getSession } from "@/lib/session";
import { getMyOrderByRefAction } from "@/lib/actions/orders";
import { isReceiptIssuable } from "@/db/orders-schema";
import {
  FUJISAN_LEGAL,
  INVOICE_REGISTRATION_NUMBER,
} from "@/data/fujisan-legal";
import { buildMetadata } from "@/lib/seo";
import { formatDateJp } from "@/lib/format-date";

export const metadata = buildMetadata({
  title: "Receipt",
  description: "ご注文の領収書。",
  path: "/account/orders/receipt",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

/**
 * 領収書。
 *
 * PDF 生成ライブラリは使わず、印刷（ブラウザの「PDF として保存」）に最適化した
 * ページとして出す。Workers 上で PDF を組むより確実で、文字化けの心配も無い。
 *
 * 電子的に提供する領収書には印紙税がかからない（課税文書の「作成」に当たらない）
 * ため、印紙の貼付欄は設けない。
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderRef: string }>;
}) {
  const session = await getSession();
  const { orderRef } = await params;
  if (!session) {
    redirect(`/login/personal?next=/account/orders/${orderRef}/receipt`);
  }

  const order = await getMyOrderByRefAction(orderRef);
  if (!order) notFound();
  // 領収書は「代金を受け取って保持している」ことの証明なので、
  // キャンセル（未入金）と返金済み（代金を返した）には発行しない。
  // 返金済みに全額の「上記正に領収いたしました」を出すと事実と食い違う。
  if (!isReceiptIssuable(order.status)) notFound();

  // 発行日は支払い確定日。Webhook 前の古い注文に備えて注文日をフォールバックにする。
  const issuedAt = order.paidAt ?? order.createdAt;
  const addressee = order.customerName.trim() || "—";

  return (
    <main className="min-h-screen bg-[#EDE6D6] py-10 print:bg-white print:py-0">
      {/* 画面でだけ出る操作列。印刷時は消す。 */}
      <div className="mx-auto mb-6 flex max-w-[760px] flex-wrap items-center justify-between gap-4 px-6 print:hidden">
        <Link
          href={`/account/orders/${order.orderRef}`}
          className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
        >
          <span aria-hidden>←</span> 注文詳細へ戻る
        </Link>
        <PrintButton />
      </div>

      {/* 領収書本体（A4 相当） */}
      <article className="mx-auto max-w-[760px] bg-white px-10 py-12 text-[#0B1A2E] shadow-[0_20px_60px_-40px_rgba(11,26,46,0.5)] print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="text-center">
          <h1 className="font-serif text-[30px] font-semibold tracking-[0.5em] text-[#0B1A2E]">
            領収書
          </h1>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-[#0B1A2E]/50">
            RECEIPT
          </p>
        </header>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-[280px] flex-1">
            <p className="border-b border-[#0B1A2E]/45 pb-2 font-serif text-[20px] tracking-[0.06em]">
              {addressee}
              <span className="ml-3 text-[13px] text-[#0B1A2E]/70">様</span>
            </p>
          </div>
          <dl className="text-right text-[12px] leading-[1.9] text-[#0B1A2E]/75">
            <div>
              <dt className="inline">発行日：</dt>
              <dd className="inline">{formatDateJp(issuedAt)}</dd>
            </div>
            <div>
              <dt className="inline">注文番号：</dt>
              <dd className="inline font-semibold text-[#0B1A2E]">
                {order.orderRef}
              </dd>
            </div>
          </dl>
        </div>

        {/* 金額 */}
        <div className="mt-8 border-y-2 border-[#0B1A2E] py-6 text-center">
          <p className="text-[10px] tracking-[0.3em] text-[#0B1A2E]/55">
            金額（税込）
          </p>
          <p className="mt-2 font-serif text-[34px] font-semibold tracking-[0.06em]">
            ¥{yen.format(order.total)}
            <span className="ml-2 align-middle text-[13px] text-[#0B1A2E]/60">
              −
            </span>
          </p>
        </div>

        <p className="mt-6 text-[13px] leading-[1.9]">
          但し、日本酒代（{order.itemsCount}点）および送料として
          <br />
          上記正に領収いたしました。
        </p>

        {/* 明細 */}
        <table className="mt-10 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-[#0B1A2E]/35 text-[10px] tracking-[0.2em] text-[#0B1A2E]/60">
              <th className="py-2 text-left font-semibold">品名</th>
              <th className="py-2 text-right font-semibold">単価</th>
              <th className="py-2 text-right font-semibold">数量</th>
              <th className="py-2 text-right font-semibold">金額</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr
                key={`${it.slug}-${it.ml}`}
                className="border-b border-[#0B1A2E]/12"
              >
                <td className="py-2.5">
                  {it.name} {it.variant}（{it.ml}ml）
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  ¥{yen.format(it.unitPrice)}
                </td>
                <td className="py-2.5 text-right tabular-nums">{it.qty}</td>
                <td className="py-2.5 text-right tabular-nums">
                  ¥{yen.format(it.lineTotal)}
                </td>
              </tr>
            ))}
            <tr className="border-b border-[#0B1A2E]/12">
              <td className="py-2.5" colSpan={3}>
                送料
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {order.shipping === 0 ? "—" : `¥${yen.format(order.shipping)}`}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#0B1A2E]">
              <td
                className="py-3 text-[11px] font-semibold tracking-[0.2em]"
                colSpan={3}
              >
                合計（消費税10%込）
              </td>
              <td className="py-3 text-right font-serif text-[16px] font-semibold tabular-nums">
                ¥{yen.format(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* 発行者 */}
        <footer className="mt-12 flex justify-end">
          <div className="text-[12px] leading-[1.95] text-[#0B1A2E]/85">
            <p className="font-serif text-[14px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
              {FUJISAN_LEGAL.sellerName}
            </p>
            <p>{FUJISAN_LEGAL.address}</p>
            <p>{FUJISAN_LEGAL.phone}</p>
            <p>{FUJISAN_LEGAL.email}</p>
            {/* 適格請求書発行事業者の登録番号は、登録済みのときだけ出す。 */}
            {INVOICE_REGISTRATION_NUMBER && (
              <p className="mt-1">
                登録番号：{INVOICE_REGISTRATION_NUMBER}
              </p>
            )}
          </div>
        </footer>

        <p className="mt-10 border-t border-[#0B1A2E]/12 pt-4 text-[10.5px] leading-[1.8] text-[#0B1A2E]/55">
          本領収書は電子的に発行されたものです（電子発行のため収入印紙の貼付は不要です）。
          {!INVOICE_REGISTRATION_NUMBER && (
            <>
              <br />
              適格請求書（インボイス）としてのご利用をご希望の場合は、お手数ですがお問い合わせください。
            </>
          )}
        </p>
      </article>
    </main>
  );
}
