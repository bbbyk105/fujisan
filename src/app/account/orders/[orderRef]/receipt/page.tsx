import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMyOrderReceiptUrlAction } from "@/lib/actions/orders";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Receipt",
  description: "ご注文の領収書です。",
  path: "/account/orders/receipt",
  noIndex: true,
});

export const dynamic = "force-dynamic";

/**
 * 領収書。書面は Stripe が出すので、ここでは組み立てず転送だけを行う。
 *
 * 開くたびに Stripe からリンクを取り直す。リンクは 30 日で切れるので、
 * 保存したものを見せると古い注文の領収書が開けなくなる。
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderRef: string }>;
}) {
  const { orderRef } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login/personal?next=/account/orders/${orderRef}/receipt`);
  }

  const url = await getMyOrderReceiptUrlAction(orderRef);
  if (!url) notFound();
  redirect(url);
}
