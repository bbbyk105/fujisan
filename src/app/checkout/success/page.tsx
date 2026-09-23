import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EdDataList } from "@/components/fujisan/editorial/ui";
import { ClearCartOnMount } from "@/components/fujisan/cart/ClearCartOnMount";
import { getStripe } from "@/lib/stripe";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Order Confirmed",
  description:
    "ご注文の受付完了ページです。",
  path: "/checkout/success",
  noIndex: true,
});

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
    <EditorialPage className="flex flex-col">
      <ClearCartOnMount />

      {/* 完了画面は中央寄せにしない。注文番号・金額・次の行き先を、
          読む順にそのまま縦に積む */}
      <section className="ed-wrap ed-wrap-narrow pb-24 pt-[128px] md:pb-32 md:pt-[172px]">
        <p className="ed-label">
          {pending ? (
            <L en="Payment pending" ja="お支払い手続き中" />
          ) : (
            <L en="Order received" ja="ご注文を承りました" />
          )}
        </p>

        <h1 className="ed-title mt-4">
          {pending ? (
            <L en="Almost there." ja="あと少しです。" />
          ) : (
            <L en="Thank you." ja="ありがとうございます。" />
          )}
        </h1>

        <p className="ed-lead mt-7">
          {pending ? (
            <L
              en="We are waiting for your payment to clear. Once it is confirmed we will email you and begin preparing your order."
              ja="お支払いの確認をお待ちしています。確認でき次第メールでお知らせし、ご注文の準備を始めます。"
            />
          ) : (
            <L
              en="We have received your order and emailed a confirmation. Bottles are checked by hand one by one and dispatched within two business days. Tracking follows when it ships."
              ja="ご注文を承り、確認メールをお送りしました。ひとつずつ検品し、原則2営業日以内に発送いたします。発送時に追跡番号をメールでお知らせします。"
            />
          )}
        </p>

        {summary?.orderRef ? (
          <EdDataList
            className="mt-12"
            rows={[
              {
                label: <L en="Order no." ja="注文番号" />,
                value: (
                  <span className="font-serif text-[16px] tabular-nums">
                    {summary.orderRef}
                  </span>
                ),
              },
              ...(summary.total !== null
                ? [
                    {
                      label: <L en="Total paid" ja="お支払い合計" />,
                      value: (
                        <span className="font-serif text-[16px] tabular-nums">
                          ¥{yen.format(summary.total)}
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        ) : null}

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
          <Link href="/account" className="ed-btn">
            <L en="View my orders" ja="注文・配送を見る" />
          </Link>
          <Link href="/shop/personal" className="ed-link text-[13px]">
            <L en="Back to the shop" ja="ショップへ戻る" />
          </Link>
        </div>
      </section>
    </EditorialPage>
  );
}
