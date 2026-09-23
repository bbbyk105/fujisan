import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
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
    <EditorialPage className="flex flex-col">
      <header className="pt-[72px] md:pt-[86px]">
        <div className="ed-wrap pb-10 pt-12 md:pb-12 md:pt-20">
          <Link href="/account#orders" className="ed-link text-[12.5px] no-underline hover:underline">
            <span aria-hidden className="mr-2">
              ←
            </span>
            <L en="Back to orders" ja="注文一覧へ戻る" />
          </Link>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="ed-label">
                <L en="Order" ja="ご注文" />
              </p>
              <h1 className="ed-title mt-3 tabular-nums">{order.orderRef}</h1>
              <p className="ed-small mt-3">
                <L en="Ordered on" ja="ご注文日" />{" "}
                {formatDateJp(order.createdAt)}
              </p>
            </div>
            <OrderStatusPill status={order.status} />
          </div>

          <span aria-hidden className="ed-rule ed-rule-strong mt-10 block" />
        </div>
      </header>

      <section className="ed-wrap flex-1 pb-24">
        {/* ===== Timeline ===== */}
        <div>
          <OrderTimeline status={order.status} />
        </div>

        {order.cancelRequestedAt && order.status !== "refunded" && (
          <p
            role="status"
            className="ed-note ed-p mt-10"
          >
            <L
              en={`We received your cancellation request on ${formatDateJp(order.cancelRequestedAt)}. Our team will contact you by email shortly.`}
              ja={`${formatDateJp(order.cancelRequestedAt)}にキャンセルのご依頼を承りました。担当より追ってメールにてご連絡いたします。`}
            />
          </p>
        )}

        {/* ===== Tracking ===== */}
        {order.trackingNumber && (
          <div className="ed-note mt-10">
            <p className="ed-label text-moss">
              <L en="Tracking" ja="追跡番号" />
            </p>
            <p className="mt-2 font-serif text-[15px] tracking-[0.04em] text-indigo">
              {order.trackingCarrier ? `${order.trackingCarrier} / ` : ""}
              {order.trackingNumber}
            </p>
            {order.shippedAt && (
              <p className="mt-1 text-[11.5px] text-indigo/60">
                <L en="Shipped" ja="発送日" />: {formatDateJp(order.shippedAt)}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          {/* ===== Items ===== */}
          <div>
            <h2 className="ed-label border-b border-[var(--ed-rule-strong)] pb-3">
              <L en="Items" ja="ご注文の商品" />
            </h2>
            <ul>
              {order.items.map((it) => {
                const product = getFujisanProductBySlug(it.slug);
                return (
                  <li
                    key={`${it.slug}-${it.ml}`}
                    className="flex gap-5 border-b border-indigo/10 py-6"
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
                        <p className="font-serif text-[15px] font-semibold tracking-[0.08em] text-indigo">
                          {it.name} {it.variant}
                        </p>
                        <p className="mt-1 text-[11.5px] tracking-[0.1em] text-indigo/62">
                          {it.ml}ml × {it.qty}
                        </p>
                        <p className="mt-1 text-[11px] text-indigo/50">
                          <L en="Unit price" ja="単価" /> ¥
                          {yen.format(it.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-serif text-[15px] font-semibold text-indigo">
                        ¥{yen.format(it.lineTotal)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ===== Shipping address ===== */}
            <h2 className="ed-label mt-14 border-b border-[var(--ed-rule-strong)] pb-3">
              <L en="Shipping to" ja="お届け先" />
            </h2>
            <address className="mt-5 text-[13.5px] not-italic leading-[1.9] text-indigo/85">
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
          <aside className="h-fit border-t-2 border-indigo bg-paper-tint/40 px-6 py-8 lg:sticky lg:top-[104px]">
            <p className="ed-label">
              <L en="Summary" ja="お支払い内容" />
            </p>

            <dl className="mt-7 space-y-3 text-[13px] text-indigo/85">
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

            <div className="mt-5 flex items-baseline justify-between border-t border-indigo/15 pt-5">
              <p className="ed-label">
                <L en="Total" ja="合計" />
              </p>
              <p className="font-serif text-[18px] font-semibold text-indigo">
                ¥{yen.format(order.total)}
              </p>
            </div>

            {/* 一部返金はステータスに出ない（注文は進行中のまま）ので、
                金額としてここに必ず出す。出さないと返金に気づけない。 */}
            {partialRefund > 0 && (
              <div className="ed-note mt-5">
                <div className="flex items-baseline justify-between gap-3 text-[12.5px] text-crimson">
                  <span className="font-semibold">
                    <L en="Refunded" ja="ご返金済み" />
                  </span>
                  <span className="font-semibold tabular-nums">
                    −¥{yen.format(partialRefund)}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-3 text-[12.5px] text-indigo">
                  <span>
                    <L en="Net charged" ja="差引ご負担額" />
                  </span>
                  <span className="font-semibold tabular-nums">
                    ¥{yen.format(order.total - partialRefund)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-[1.7] text-indigo/65">
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
                  className="ed-btn"
                >
                  <L en="View receipt" ja="領収書を表示" />
                </Link>
              )}
              <ReorderButton items={order.items} />
              {canCancel && <CancelOrderButton orderRef={order.orderRef} />}
            </div>

            <p className="mt-6 text-[11px] leading-[1.7] text-indigo/55">
              <L
                en={
                  <>
                    Questions about this order?{" "}
                    <Link
                      href="/contact"
                      className="ed-link"
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
                      className="ed-link"
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

    </EditorialPage>
  );
}
