import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminOrderRow } from "@/components/fujisan/admin/AdminOrderRow";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import {
  AdminForbidden,
  AdminKpi,
  AdminNav,
} from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import {
  getEffectiveAdminRole,
  isOwner,
  isStaffOrAbove,
} from "@/lib/admin";
import { adminListOrdersAction } from "@/lib/actions/admin-orders";
import type { OrderStatus } from "@/db/orders-schema";

export const metadata = {
  title: "Admin · Orders — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ filter?: string }>;

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

  const res = await adminListOrdersAction();
  const orders = res.ok ? res.orders : [];

  const params = (await props.searchParams) ?? {};
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
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="bg-[#0B1A2E] fujisan-dark-panel text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 bg-[#E2C97E] px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]">
                ADMIN · 蔵 内
              </span>
              <span className="inline-flex items-center gap-2 border border-[#E2C97E]/55 px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#E2C97E]">
                {isOwnerUser ? "OWNER · 蔵元" : "STAFF · 蔵スタッフ"}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#F2E4C7]">
              注文・配送の管理
            </h1>
            <p className="mt-3 text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/70">
              {email}
            </p>
            <AdminNav current="orders" isOwnerUser={isOwnerUser} />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 md:gap-x-10">
            <AdminKpi label="進行中" value={`${inFlight}`} suffix="件" />
            <AdminKpi label="発送済" value={`${counts.shipped}`} suffix="件" />
            <AdminKpi label="お届け済" value={`${counts.delivered}`} suffix="件" />
            <AdminKpi
              label="売上合計"
              value={`¥${new Intl.NumberFormat("ja-JP").format(totalRevenue)}`}
            />
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {orders.length === 0 ? (
          <div className="border border-dashed border-[#0B1A2E]/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              まだ注文がありません。
            </p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[12.5px] leading-[1.75] text-[#0B1A2E]/70">
              お客様の決済が完了すると、ここに表示されステータスや追跡番号を更新できます。
            </p>
          </div>
        ) : (
          <>
            {/* ステータス絞り込みタブ */}
            <nav
              aria-label="注文の絞り込み"
              className="flex flex-wrap items-center gap-2 border-b border-[#0B1A2E]/15 pb-4"
            >
              {FILTERS.map((f) => {
                const active = f.key === filter.key;
                const count = f.statuses
                  ? orders.filter((o) => f.statuses!.includes(o.status)).length
                  : orders.length;
                return (
                  <Link
                    key={f.key}
                    href={
                      f.key === "all"
                        ? "/admin/orders"
                        : `/admin/orders?filter=${f.key}`
                    }
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 border px-4 py-2 text-[10.5px] font-semibold tracking-[0.2em] no-underline transition-colors ${
                      active
                        ? "border-[#0B1A2E] bg-[#0B1A2E] text-paper-card"
                        : "border-[#0B1A2E]/20 bg-transparent text-[#0B1A2E]/70 hover:border-[#0B1A2E]/50 hover:text-[#0B1A2E]"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`font-serif text-[11.5px] tracking-normal ${
                        active ? "text-paper-card/75" : "text-[#0B1A2E]/45"
                      }`}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {visibleOrders.length === 0 ? (
              <div className="mt-8 border border-dashed border-[#0B1A2E]/25 bg-paper/55 px-7 py-14 text-center">
                <p className="font-serif text-[14px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                  「{filter.label}」の注文はありません。
                </p>
              </div>
            ) : (
              <>
                {/* Table header（モバイルは各行がカード表示になるため非表示） */}
                <div className="mt-6 hidden grid-cols-[120px_minmax(0,1fr)_110px_100px_130px_24px] items-center gap-4 border-b border-[#0B1A2E]/15 px-6 pb-3 text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/55 md:grid">
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

        <div className="mt-12 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-8">
          <Link
            href="/account"
            className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
          >
            ← マイアカウントへ
          </Link>
          <LogoutButton />
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
