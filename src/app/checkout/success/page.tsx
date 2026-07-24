import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { ClearCartOnMount } from "@/components/fujisan/cart/ClearCartOnMount";
import { getStripe } from "@/lib/stripe";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Order Confirmed — FUJISAN SAKE",
  robots: { index: false },
};

// session_id を読み Stripe を参照するため動的レンダー。
export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

type Summary = { orderRef: string | null; total: number | null; paid: boolean };

async function loadSummary(sessionId?: string): Promise<Summary | null> {
  if (!sessionId) return null;
  const { env } = await getCloudflareContext({ async: true });
  const key = (env as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const stripe = getStripe(key);
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      orderRef: s.metadata?.orderRef ?? null,
      total: typeof s.amount_total === "number" ? s.amount_total : null,
      paid: s.payment_status === "paid",
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const summary = await loadSummary(session_id);
  const pending = summary !== null && !summary.paid; // コンビニ等の後払い待ち

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />
      <ClearCartOnMount />

      <section className="bg-paper">
        <div className="mx-auto max-w-[760px] px-7 py-24 text-center md:px-12 md:py-32">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#C9A84C]">
            {pending ? (
              <L en="PAYMENT PENDING" ja="お支払い手続き中" />
            ) : (
              <L en="ORDER CONFIRMED" ja="ご注文を承りました" />
            )}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            {pending ? (
              <L en="Almost there." ja="あと少しです。" />
            ) : (
              <L en="Thank you." ja="ありがとうございます。" />
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[13.5px] leading-[1.8] text-[#1D2432]/78">
            {pending ? (
              <L
                en="We're waiting for your payment to clear. Once it's confirmed, we'll email you and begin preparing your order."
                ja="お支払いの確認をお待ちしています。確認でき次第、メールでお知らせし、ご注文の準備を始めます。"
              />
            ) : (
              <L
                en="We've received your order and emailed a confirmation. Bottles are hand-checked one by one and dispatched within two business days. We'll send tracking when it ships."
                ja="ご注文を承り、確認メールをお送りしました。ひとつずつ検品し、原則 2 営業日以内に発送いたします。発送時に追跡番号をメールでお知らせします。"
              />
            )}
          </p>

          {summary?.orderRef ? (
            <div className="mx-auto mt-9 max-w-[360px] border border-[#0B1A2E]/15 bg-paper-card px-7 py-6 text-left">
              <div className="flex items-center justify-between text-[12px]">
                <span className="tracking-[0.18em] text-[#0B1A2E]/60">
                  <L en="ORDER No." ja="注文番号" />
                </span>
                <span className="font-serif text-[15px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                  {summary.orderRef}
                </span>
              </div>
              {summary.total !== null ? (
                <div className="mt-3 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-3 text-[12px]">
                  <span className="tracking-[0.18em] text-[#0B1A2E]/60">
                    <L en="TOTAL PAID" ja="お支払い合計" />
                  </span>
                  <span className="font-serif text-[15px] font-semibold text-[#0B1A2E]">
                    ¥{yen.format(summary.total)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/account"
              className="group/btn inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
            >
              <L en="VIEW MY ORDERS" ja="注文・配送を見る" />
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/btn:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/shop/personal"
              className="inline-flex items-center justify-center gap-2 border border-[#0B1A2E]/25 px-8 py-4 text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E] no-underline transition-colors hover:border-[#0B1A2E]"
            >
              <L en="BACK TO THE SHOP" ja="ショップへ戻る" />
            </Link>
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
