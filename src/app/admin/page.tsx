import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { adminDashboardAction } from "@/lib/actions/admin-dashboard";
import type { OrderStatus } from "@/db/orders-schema";

export const metadata = {
  title: "Admin — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "受付済",
  confirmed: "注文確定",
  preparing: "準備中",
  shipped: "発送済み",
  delivered: "お届け済",
  cancelled: "キャンセル",
  refunded: "返金済み",
};

function jstDate(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  const sessUser = session?.user as { id?: string; email?: string } | undefined;
  const email = sessUser?.email;

  if (!session) redirect("/login/personal?next=/admin");

  const role = await getEffectiveAdminRole({ userId: sessUser?.id, email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={email} />;
  const isOwnerUser = isOwner(role);

  const res = await adminDashboardAction();
  const s = res.ok ? res.summary : null;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="蔵の管理トップ"
        email={email}
        isOwnerUser={isOwnerUser}
        current="dashboard"
        kpis={
          s ? (
            <>
              <AdminKpi
                label="今日の売上"
                value={`¥${yen.format(s.today.revenue)}`}
              />
              <AdminKpi
                label="今月の売上"
                value={`¥${yen.format(s.month.revenue)}`}
              />
              <AdminKpi label="今月の件数" value={`${s.month.orders}`} suffix="件" />
              <AdminKpi
                label="要対応"
                value={`${s.actionRequired}`}
                suffix="件"
              />
            </>
          ) : null
        }
      />

      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {!s ? (
          <div className="border border-dashed border-[#0B1A2E]/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              集計を読み込めませんでした。
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.75] text-[#0B1A2E]/70">
              時間をおいて再読み込みするか、
              <Link href="/admin/orders" className="ml-1 underline">
                注文一覧
              </Link>
              から確認してください。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* 直近の注文 */}
            <div className="border border-[#0B1A2E]/15 bg-paper-card/70 px-6 py-6 md:px-7">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                  直近の注文
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-[10.5px] font-semibold tracking-[0.24em] text-[#0B1A2E]/65 no-underline transition-colors hover:text-[#0B1A2E]"
                >
                  すべて見る →
                </Link>
              </div>

              {s.recent.length === 0 ? (
                <p className="mt-6 text-[12.5px] leading-[1.8] text-[#0B1A2E]/65">
                  まだ確定した注文がありません。決済が完了すると、ここに表示されます。
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-[#0B1A2E]/10">
                  {s.recent.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-[13px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                          {o.orderRef}
                        </span>
                        <span className="text-[11.5px] text-[#0B1A2E]/70">
                          {o.customerName || "（お名前未取得）"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-[10.5px] font-semibold tracking-[0.18em] text-[#0B1A2E]/60">
                          {STATUS_LABEL[o.status]}
                        </span>
                        <span className="text-[11px] text-[#0B1A2E]/45">
                          {jstDate(o.createdAt)}
                        </span>
                        <span className="font-serif text-[13.5px] font-semibold text-[#0B1A2E]">
                          ¥{yen.format(o.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 在庫アラート */}
            <div className="flex flex-col gap-6">
              <div className="border border-[#0B1A2E]/15 bg-paper-card/70 px-6 py-6 md:px-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                    在庫アラート
                  </h2>
                  <Link
                    href="/admin/products"
                    className="text-[10.5px] font-semibold tracking-[0.24em] text-[#0B1A2E]/65 no-underline transition-colors hover:text-[#0B1A2E]"
                  >
                    在庫を編集 →
                  </Link>
                </div>

                {s.soldOut.length === 0 && s.lowStock.length === 0 ? (
                  <p className="mt-5 text-[12.5px] leading-[1.8] text-[#0B1A2E]/65">
                    在庫はすべて十分です。
                  </p>
                ) : (
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {s.soldOut.map((x) => (
                      <li
                        key={x.id}
                        className="flex items-baseline justify-between gap-3 border border-crimson/35 bg-crimson/6 px-4 py-2.5"
                      >
                        <span className="text-[12px] text-[#0B1A2E]">
                          {x.label}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold tracking-[0.18em] text-crimson">
                          完売
                        </span>
                      </li>
                    ))}
                    {s.lowStock.map((x) => (
                      <li
                        key={x.id}
                        className="flex items-baseline justify-between gap-3 border border-[#C9A84C]/50 bg-[#C9A84C]/8 px-4 py-2.5"
                      >
                        <span className="text-[12px] text-[#0B1A2E]">
                          {x.label}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold tracking-[0.18em] text-[#8A6D1F]">
                          残り{x.stockQty}本
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border border-[#0B1A2E]/15 bg-paper-tint/60 px-6 py-6 md:px-7">
                <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                  累計
                </h2>
                <dl className="mt-5 flex flex-col gap-3 text-[12.5px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#0B1A2E]/65">売上合計</dt>
                    <dd className="font-serif text-[15px] font-semibold text-[#0B1A2E]">
                      ¥{yen.format(s.allTime.revenue)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#0B1A2E]/65">注文件数</dt>
                    <dd className="font-serif text-[15px] font-semibold text-[#0B1A2E]">
                      {yen.format(s.allTime.orders)} 件
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#0B1A2E]/65">今日の件数</dt>
                    <dd className="font-serif text-[15px] font-semibold text-[#0B1A2E]">
                      {s.today.orders} 件
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-[11px] leading-[1.75] text-[#0B1A2E]/50">
                  売上はキャンセル・返金を除いた金額です。日付は日本時間で集計しています。
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <FujisanFooter />
    </main>
  );
}
