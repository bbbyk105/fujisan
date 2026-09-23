import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { AdminForbidden } from "@/components/fujisan/admin/AdminChrome";
import { PrintButton } from "@/components/fujisan/auth/PrintButton";
import { adminGetOrderByRefAction } from "@/lib/actions/admin-orders";
import { orderStatusJp } from "@/data/fujisan-orders";
import { FUJISAN_LEGAL, UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";
import { formatDateJp, formatDateTimeJp } from "@/lib/format-date";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Packing slip",
  description: "納品書の印刷。",
  path: "/admin/orders",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

/**
 * 納品書（梱包時に同梱する明細）。
 *
 * 領収書と役割が違う。領収書は「代金を受け取った」証で、納品書は
 * 「何を何本入れたか」の控え。**金額の合計は出すが「領収いたしました」とは
 * 書かない** — 未入金の注文にも同梱しうるため。
 *
 * 送り状（配送ラベル）はここでは作らない。ヤマト B2 クラウドなど配送業者の
 * システムが発行するものでなければ受け付けてもらえないので、自前で似たものを
 * 出しても使えない。追跡番号は発送後に注文の編集欄へ入れる。
 */
export default async function PackingSlipPage(props: {
  params: Promise<{ orderRef: string }>;
}) {
  const { orderRef } = await props.params;
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) {
    redirect(`/login/personal?next=/admin/orders/${orderRef}/packing-slip`);
  }

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;

  const res = await adminGetOrderByRefAction(orderRef);
  if (!res.ok) notFound();
  const order = res.order;

  return (
    <main className="min-h-screen bg-paper-tint py-10 print:bg-white print:py-0">
      {/* 画面でだけ出る操作列。印刷時は消す。 */}
      <div className="mx-auto mb-6 flex max-w-[760px] flex-wrap items-center justify-between gap-4 px-6 print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-indigo/75 no-underline hover:text-indigo"
        >
          <span aria-hidden>←</span> 注文一覧へ戻る
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[760px] bg-white px-10 py-12 text-indigo shadow-[0_20px_60px_-40px_rgba(11,26,46,0.5)] print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="text-center">
          <h1 className="font-serif text-[28px] font-semibold tracking-[0.5em] text-indigo">
            納品書
          </h1>
          <p className="mt-2 text-[10px] tracking-[0.3em] text-indigo/55">
            PACKING SLIP
          </p>
        </header>

        {/* お届け先と注文情報 */}
        <div className="mt-10 flex flex-wrap justify-between gap-8">
          <div className="min-w-[280px]">
            <p className="text-[10px] tracking-[0.28em] text-indigo/55">
              お届け先
            </p>
            <p className="mt-3 border-b border-indigo/25 pb-1 font-serif text-[19px] tracking-[0.08em]">
              {order.customerName.trim() || "—"} 様
            </p>
            <p className="mt-3 text-[12.5px] leading-[1.9] text-indigo/85">
              〒{order.postalCode || "—"}
              <br />
              {order.address || "—"}
              <br />
              {order.phone || "—"}
            </p>
          </div>

          <dl className="min-w-[220px] text-[12.5px] leading-[2]">
            <div className="flex justify-between gap-6">
              <dt className="text-indigo/55">注文番号</dt>
              <dd className="font-semibold tracking-[0.08em]">
                {order.orderRef}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-indigo/55">ご注文日</dt>
              <dd>{formatDateJp(order.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-indigo/55">状態</dt>
              <dd>{orderStatusJp(order.status)}</dd>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between gap-6">
                <dt className="text-indigo/55">追跡番号</dt>
                <dd className="tabular-nums">
                  {order.trackingCarrier} {order.trackingNumber}
                </dd>
              </div>
            )}
            {order.shippedAt && (
              <div className="flex justify-between gap-6">
                <dt className="text-indigo/55">発送日時</dt>
                <dd>{formatDateTimeJp(order.shippedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* 明細。梱包のチェックに使うので、本数を大きく出す。 */}
        <table className="mt-10 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-indigo/35 text-[10px] tracking-[0.2em] text-indigo/60">
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
                className="border-b border-indigo/12"
              >
                <td className="py-3">
                  {it.name} {it.variant}
                  <span className="ml-2 text-[11.5px] text-indigo/60">
                    {it.ml}ml
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums">
                  ¥{yen.format(it.unitPrice)}
                </td>
                <td className="py-3 text-right font-serif text-[16px] font-semibold tabular-nums">
                  {it.qty}
                </td>
                <td className="py-3 text-right tabular-nums">
                  ¥{yen.format(it.lineTotal)}
                </td>
              </tr>
            ))}
            <tr className="border-b border-indigo/12">
              <td className="py-2.5 text-indigo/70" colSpan={3}>
                送料
              </td>
              <td className="py-2.5 text-right tabular-nums">
                {order.shipping === 0 ? "—" : `¥${yen.format(order.shipping)}`}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-indigo">
              <td
                className="py-3 text-[11px] font-semibold tracking-[0.2em]"
                colSpan={2}
              >
                合計（消費税10%込）
              </td>
              <td className="py-3 text-right font-serif text-[16px] font-semibold tabular-nums">
                {order.itemsCount} 本
              </td>
              <td className="py-3 text-right font-serif text-[16px] font-semibold tabular-nums">
                ¥{yen.format(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-[40ch] text-[11px] leading-[1.9] text-indigo/70">
            このたびはお買い上げいただき、ありがとうございます。
            <br />
            万一、品物に不足や破損がございましたら、お手数ですが下記までご連絡ください。
          </p>
          <div className="text-[12px] leading-[1.95] text-indigo/85">
            <p className="font-serif text-[14px] font-semibold tracking-[0.06em] text-indigo">
              {FUJISAN_LEGAL.sellerName}
            </p>
            <p>{FUJISAN_LEGAL.address}</p>
            <p>{FUJISAN_LEGAL.phone}</p>
            <p>{FUJISAN_LEGAL.email}</p>
          </div>
        </footer>

        <p className="mt-8 border-t border-indigo/12 pt-4 text-[10.5px] leading-[1.8] text-indigo/55">
          {UNDERAGE_NOTICE_JP}
          <br />
          本書は納品の控えです。領収書はお客様のアカウントから発行いただけます。
        </p>
      </article>
    </main>
  );
}
