import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { OrderTimeline } from "@/components/fujisan/auth/OrderTimeline";
import { OrderStatusPill } from "@/components/fujisan/auth/OrderStatusPill";
import { CancelOrderButton } from "@/components/fujisan/auth/CancelOrderButton";
import { ReorderButton } from "@/components/fujisan/auth/ReorderButton";
import { getSession } from "@/lib/session";
import { getMyOrderByRefAction } from "@/lib/actions/orders";
import { isReceiptIssuable } from "@/db/orders-schema";
import { getFujisanProductBySlug } from "@/data/fujisan-products";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";
import { formatDateJp } from "@/lib/format-date";

export const metadata = buildMetadata({
  title: "Order detail",
  description: "ご注文の明細・お届け先・配送状況をご確認いただけます。",
  path: "/account/orders",
  noIndex: true,
});

// 自分の注文だけを出すのでキャッシュしない。
export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

/** 発送前＝まだキャンセルを受け付けられる状態。 */
const CANCELLABLE = new Set(["confirmed", "preparing"]);

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderRef: string }>;
}) {
  const session = await getSession();
  const { orderRef } = await params;
  if (!session) {
    redirect(`/login/personal?next=/account/orders/${orderRef}`);
  }

  // 自分の注文でなければ 404。存在の有無も漏らさない。
  const order = await getMyOrderByRefAction(orderRef);
  if (!order) notFound();

  const canCancel =
    CANCELLABLE.has(order.status) && order.cancelRequestedAt === null;

  // 一部返金の額。全額返金（status が refunded）はステータス表示で伝わるので、
  // ここでは金額の内訳としてだけ扱う。
  const partialRefund =
    order.status === "refunded" ? 0 : (order.refundedAmount ?? 0);
  // 返金済み・キャンセル済みには領収書を出さない（発行条件はスキーマ側に集約）。
  const receiptAvailable = isReceiptIssuable(order.status);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* ===== Header ===== */}
      <section className="fujisan-dark-panel relative bg-[#1B130A] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto max-w-[1080px] px-7 pb-12 pt-[124px] md:px-12 md:pb-14 md:pt-[150px]">
          <Link
            href="/account#orders"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-[#F2E4C7]/70 no-underline transition-colors hover:text-[#E2C97E]"
          >
            <span aria-hidden>←</span>
            <L en="BACK TO ORDERS" ja="注文一覧へ戻る" />
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#E2C97E]/80">
                ORDER · ご注文
              </p>
              <h1 className="mt-4 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.16] tracking-[0.08em] text-[#F2E4C7]">
                {order.orderRef}
              </h1>
              <p className="mt-3 text-[12.5px] text-[#F2E4C7]/70">
                <L en="Ordered on" ja="ご注文日" /> {formatDateJp(order.createdAt)}
              </p>
            </div>
            <OrderStatusPill status={order.status} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* ===== Timeline ===== */}
        <div className="border border-[#0B1A2E]/12 bg-paper-card px-7 py-8 md:px-10 md:py-9">
          <OrderTimeline status={order.status} />
        </div>

        {order.cancelRequestedAt && order.status !== "refunded" && (
          <p
            role="status"
            className="mt-4 border border-[#C9A84C]/60 bg-[#F1E6CB]/55 px-5 py-4 text-[12.5px] leading-[1.75] text-[#0B1A2E]"
          >
            <L
              en={`We received your cancellation request on ${formatDateJp(order.cancelRequestedAt)}. Our team will contact you by email shortly.`}
              ja={`${formatDateJp(order.cancelRequestedAt)}にキャンセルのご依頼を承りました。担当より追ってメールにてご連絡いたします。`}
            />
          </p>
        )}

        {/* ===== Tracking ===== */}
        {order.trackingNumber && (
          <div className="mt-4 border border-[#5C8A5C]/40 bg-[#5C8A5C]/[0.07] px-6 py-5">
            <p className="text-[9.5px] font-semibold tracking-[0.28em] text-[#2F5A2F]">
              <L en="TRACKING" ja="追跡番号" />
            </p>
            <p className="mt-2 font-serif text-[15px] tracking-[0.04em] text-[#0B1A2E]">
              {order.trackingCarrier ? `${order.trackingCarrier} / ` : ""}
              {order.trackingNumber}
            </p>
            {order.shippedAt && (
              <p className="mt-1 text-[11.5px] text-[#0B1A2E]/60">
                <L en="Shipped" ja="発送日" />: {formatDateJp(order.shippedAt)}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          {/* ===== Items ===== */}
          <div>
            <h2 className="border-b border-[#0B1A2E]/15 pb-4 font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="ITEMS" ja="ご注文の商品" />
            </h2>
            <ul>
              {order.items.map((it) => {
                const product = getFujisanProductBySlug(it.slug);
                return (
                  <li
                    key={`${it.slug}-${it.ml}`}
                    className="flex gap-5 border-b border-[#0B1A2E]/10 py-6"
                  >
                    {product && (
                      <Link
                        href={`/products/${it.slug}`}
                        className="relative h-[92px] w-[60px] shrink-0 no-underline"
                      >
                        <Image
                          src={product.img}
                          alt=""
                          fill
                          sizes="60px"
                          className="object-contain object-bottom"
                        />
                      </Link>
                    )}
                    <div className="flex flex-1 items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-[15px] font-semibold tracking-[0.08em] text-[#0B1A2E]">
                          {it.name} {it.variant}
                        </p>
                        <p className="mt-1 text-[11.5px] tracking-[0.1em] text-[#0B1A2E]/62">
                          {it.ml}ml × {it.qty}
                        </p>
                        <p className="mt-1 text-[11px] text-[#0B1A2E]/50">
                          <L en="Unit price" ja="単価" /> ¥
                          {yen.format(it.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-serif text-[15px] font-semibold text-[#0B1A2E]">
                        ¥{yen.format(it.lineTotal)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ===== Shipping address ===== */}
            <h2 className="mt-12 border-b border-[#0B1A2E]/15 pb-4 font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="SHIPPING TO" ja="お届け先" />
            </h2>
            <address className="mt-5 text-[13.5px] not-italic leading-[1.9] text-[#1D2432]/85">
              {order.customerName}
              <br />
              〒{order.postalCode}
              <br />
              {order.address}
              {order.phone && (
                <>
                  <br />
                  {order.phone}
                </>
              )}
            </address>
          </div>

          {/* ===== Summary ===== */}
          <aside className="h-fit border border-[#0B1A2E]/12 bg-paper-card px-7 py-8 lg:sticky lg:top-[104px]">
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="SUMMARY" ja="お支払い内容" />
            </p>
            <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

            <dl className="mt-7 space-y-3 text-[13px] text-[#1D2432]/85">
              <div className="flex items-center justify-between">
                <dt>
                  <L en="Subtotal (tax incl.)" ja="小計（税込）" />
                </dt>
                <dd className="font-semibold">¥{yen.format(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>
                  <L en="Shipping" ja="送料" />
                </dt>
                <dd className="font-semibold">
                  {order.shipping === 0 ? (
                    <L en="Free" ja="無料" />
                  ) : (
                    `¥${yen.format(order.shipping)}`
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-[#0B1A2E]/15 pt-5">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#0B1A2E]/70">
                <L en="TOTAL" ja="合計" />
              </p>
              <p className="font-serif text-[18px] font-semibold text-[#0B1A2E]">
                ¥{yen.format(order.total)}
              </p>
            </div>

            {/* 一部返金はステータスに出ない（注文は進行中のまま）ので、
                金額としてここに必ず出す。出さないと返金に気づけない。 */}
            {partialRefund > 0 && (
              <div className="mt-4 border border-[#8B1A1A]/30 bg-[#8B1A1A]/[0.05] px-4 py-3">
                <div className="flex items-baseline justify-between gap-3 text-[12.5px] text-[#8B1A1A]">
                  <span className="font-semibold">
                    <L en="Refunded" ja="ご返金済み" />
                  </span>
                  <span className="font-semibold tabular-nums">
                    −¥{yen.format(partialRefund)}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-3 text-[12.5px] text-[#0B1A2E]">
                  <span>
                    <L en="Net charged" ja="差引ご負担額" />
                  </span>
                  <span className="font-semibold tabular-nums">
                    ¥{yen.format(order.total - partialRefund)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-[1.7] text-[#0B1A2E]/65">
                  <L
                    en="The remainder of your order will still be shipped."
                    ja="ご注文はこのまま発送いたします。"
                  />
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {receiptAvailable && (
                <Link
                  href={`/account/orders/${order.orderRef}/receipt`}
                  className="inline-flex items-center justify-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.28em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
                >
                  <L en="VIEW RECEIPT" ja="領収書を表示" />
                </Link>
              )}
              <ReorderButton items={order.items} />
              {canCancel && <CancelOrderButton orderRef={order.orderRef} />}
            </div>

            <p className="mt-6 text-[11px] leading-[1.7] text-[#0B1A2E]/55">
              <L
                en={
                  <>
                    Questions about this order?{" "}
                    <Link
                      href="/contact"
                      className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2"
                    >
                      Contact us
                    </Link>
                    .
                  </>
                }
                ja={
                  <>
                    ご注文についてのお問い合わせは
                    <Link
                      href="/contact"
                      className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2"
                    >
                      こちら
                    </Link>
                    から。
                  </>
                }
              />
            </p>
          </aside>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
