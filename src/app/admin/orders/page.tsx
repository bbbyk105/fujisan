import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminOrderRow } from "@/components/fujisan/admin/AdminOrderRow";
import { AdminOrderToolbar } from "@/components/fujisan/admin/AdminOrderToolbar";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import {
  getEffectiveAdminRole,
  isOwner,
  isStaffOrAbove,
} from "@/lib/admin";
import { adminListOrdersAction } from "@/lib/actions/admin-orders";
import type { OrderStatus } from "@/db/orders-schema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Orders",
  description:
    "注文・配送の管理。",
  path: "/admin/orders",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ filter?: string; from?: string; to?: string }>;

/** ステータス絞り込みタブ。「要対応」= 入金確認〜発送準備の、蔵側の作業が残っている注文。 */
const FILTERS: Array<{
  key: string;
  label: string;
  statuses: OrderStatus[] | null;
}> = [
  { key: "all", label: "すべて", statuses: null },
  { key: "action", label: "要対応", statuses: ["pending", "confirmed", "preparing"] },
  { key: "shipped", label: "発送済み", statuses: ["shipped"] },
  { key: "delivered", label: "お届け済", statuses: ["delivered"] },
  { key: "closed", label: "キャンセル・返金", statuses: ["cancelled", "refunded"] },
];

/** ステータスタブのリンク。**期間の指定は保つ**（切り替えるたびに外れると使えない）。 */
function buildFilterHref(key: string, from: string, to: string): string {
  const q = new URLSearchParams();
  if (key !== "all") q.set("filter", key);
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const qs = q.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const sessUser = session?.user as
    | { id?: string; email?: string }
    | undefined;
  const email = sessUser?.email;

  if (!session) {
    redirect("/login/personal?next=/admin/orders");
  }
  const role = await getEffectiveAdminRole({
    userId: sessUser?.id,
    email,
  });
  if (!isStaffOrAbove(role)) {
    return <AdminForbidden email={email} />;
  }
  const isOwnerUser = isOwner(role);

  const params = (await props.searchParams) ?? {};
  // 期間は SQL 側で絞る（取得してから捨てると、上限 200 件が期間外の注文で
  // 埋まって、指定した期間の注文が出てこない）。
  const from = params.from ?? "";
  const to = params.to ?? "";
  const res = await adminListOrdersAction({
    from: from || undefined,
    to: to || undefined,
  });
  const orders = res.ok ? res.orders : [];

  const filter =
    FILTERS.find((f) => f.key === params.filter) ?? FILTERS[0];
  const visibleOrders = filter.statuses
    ? orders.filter((o) => filter.statuses!.includes(o.status))
    : orders;

  // KPIごとの集計（簡易ダッシュボード）
  const counts = orders.reduce<Record<OrderStatus, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    },
  );
  const inFlight = counts.pending + counts.confirmed + counts.preparing;
  // 売上はキャンセル・返金を除外（返金済みは実質未計上）。
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-indigo">
      <FujisanNav />

      <AdminHeader
        wide
        title="注文・配送の管理"
        email={email}
        isOwnerUser={isOwnerUser}
        current="orders"
        kpis={
          <>
            <AdminKpi label="進行中" value={`${inFlight}`} suffix="件" />
            <AdminKpi label="発送済" value={`${counts.shipped}`} suffix="件" />
            <AdminKpi
              label="お届け済"
              value={`${counts.delivered}`}
              suffix="件"
            />
            <AdminKpi
              label="売上合計"
              value={`¥${new Intl.NumberFormat("ja-JP").format(totalRevenue)}`}
            />
          </>
        }
      />

      {/* Body */}
      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {orders.length === 0 ? (
          <div className="border border-dashed border-indigo/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-indigo">
              まだ注文がありません。
            </p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[12.5px] leading-[1.75] text-indigo/70">
              お客様の決済が完了すると、ここに表示されステータスや追跡番号を更新できます。
            </p>
          </div>
        ) : (
          <>
            <AdminOrderToolbar from={from} to={to} />

            {/* ステータス絞り込みタブ */}
            <nav
              aria-label="注文の絞り込み"
              className="flex flex-wrap items-center gap-2 border-b border-indigo/15 pb-4"
            >
              {FILTERS.map((f) => {
                const active = f.key === filter.key;
                const count = f.statuses
                  ? orders.filter((o) => f.statuses!.includes(o.status)).length
                  : orders.length;
                return (
                  <Link
                    key={f.key}
                    href={buildFilterHref(f.key, from, to)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 border px-4 py-2 text-[10.5px] font-semibold tracking-[0.2em] no-underline transition-colors ${
                      active
                        ? "border-indigo bg-indigo text-paper-card"
                        : "border-indigo/20 bg-transparent text-indigo/70 hover:border-indigo/50 hover:text-indigo"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`font-serif text-[11.5px] tracking-normal ${
                        active ? "text-paper-card/75" : "text-indigo/45"
                      }`}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {visibleOrders.length === 0 ? (
              <div className="mt-8 border border-dashed border-indigo/25 bg-paper/55 px-7 py-14 text-center">
                <p className="font-serif text-[14px] font-semibold tracking-[0.04em] text-indigo">
                  「{filter.label}」の注文はありません。
                </p>
              </div>
            ) : (
              <>
                {/* Table header（モバイルは各行がカード表示になるため非表示） */}
                <div className="mt-6 hidden grid-cols-[120px_minmax(0,1fr)_110px_100px_130px_24px] items-center gap-4 border-b border-indigo/15 px-6 pb-3 text-[10px] font-semibold tracking-[0.28em] text-indigo/55 md:grid">
                  <span>注文番号</span>
                  <span>顧客</span>
                  <span>注文日</span>
                  <span className="text-right">合計</span>
                  <span>ステータス</span>
                  <span />
                </div>

                <ul className="mt-4 flex flex-col gap-3 md:mt-4">
                  {visibleOrders.map((o) => (
                    <AdminOrderRow
                      key={o.id}
                      order={o}
                      canRefund={isOwnerUser}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
