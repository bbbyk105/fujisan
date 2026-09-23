import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { adminDashboardAction } from "@/lib/actions/admin-dashboard";
import { orderStatusJp } from "@/data/fujisan-orders";
import { formatDayTimeJp } from "@/lib/format-date";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin",
  description: "蔵の管理トップ。",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

export default async function AdminDashboardPage() {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const res = await adminDashboardAction();
  const s = res.ok ? res.summary : null;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-indigo">
      <FujisanNav />

      <AdminHeader
        title="蔵の管理トップ"
        email={u?.email}
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
              <AdminKpi
                label="今月の件数"
                value={`${s.month.orders}`}
                suffix="件"
              />
              <AdminKpi
                label="発送待ち"
                value={`${s.actionRequired}`}
                suffix="件"
              />
            </>
          ) : null
        }
      />

      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {!s ? (
          <div className="border border-dashed border-indigo/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-indigo">
              集計を読み込めませんでした。
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.75] text-indigo/70">
              時間をおいて再読み込みするか、
              <Link href="/admin/orders" className="ml-1 underline">
                注文一覧
              </Link>
              から確認してください。
            </p>
          </div>
        ) : (
          <>
            <TodoStrip summary={s} />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* 直近の注文 */}
              <div className="border border-indigo/15 bg-paper-card/70 px-6 py-6 md:px-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-indigo">
                    直近の注文
                  </h2>
                  <Link
                    href="/admin/orders"
                    className="text-[10.5px] font-semibold tracking-[0.24em] text-indigo/65 no-underline transition-colors hover:text-indigo"
                  >
                    すべて見る →
                  </Link>
                </div>

                {s.recent.length === 0 ? (
                  <p className="mt-6 text-[12.5px] leading-[1.8] text-indigo/65">
                    まだ確定した注文がありません。決済が完了すると、ここに表示されます。
                  </p>
                ) : (
                  <ul className="mt-5 divide-y divide-indigo/10">
                    {s.recent.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="font-serif text-[13px] font-semibold tracking-[0.06em] text-indigo">
                            {o.orderRef}
                          </span>
                          <span className="text-[11.5px] text-indigo/70">
                            {o.customerName || "（お名前未取得）"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                          <span className="text-[10.5px] font-semibold tracking-[0.18em] text-indigo/60">
                            {orderStatusJp(o.status)}
                          </span>
                          <span className="text-[11px] tabular-nums text-indigo/45">
                            {formatDayTimeJp(o.createdAt)}
                          </span>
                          <span className="font-serif text-[13.5px] font-semibold tabular-nums text-indigo">
                            ¥{yen.format(o.total)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {/* 在庫アラート */}
                <div className="border border-indigo/15 bg-paper-card/70 px-6 py-6 md:px-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-indigo">
                      在庫アラート
                    </h2>
                    <Link
                      href="/admin/products"
                      className="text-[10.5px] font-semibold tracking-[0.24em] text-indigo/65 no-underline transition-colors hover:text-indigo"
                    >
                      在庫を編集 →
                    </Link>
                  </div>

                  {s.soldOut.length === 0 && s.lowStock.length === 0 ? (
                    <p className="mt-5 text-[12.5px] leading-[1.8] text-indigo/65">
                      在庫管理中の SKU に、完売・僅少のものはありません。
                    </p>
                  ) : (
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {s.soldOut.map((x) => (
                        <li
                          key={x.id}
                          className="flex items-baseline justify-between gap-3 border border-crimson/35 bg-crimson/[0.06] px-4 py-2.5"
                        >
                          <span className="text-[12px] text-indigo">
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
                          className="flex items-baseline justify-between gap-3 border border-gold/50 bg-gold/[0.08] px-4 py-2.5"
                        >
                          <span className="text-[12px] text-indigo">
                            {x.label}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold tabular-nums tracking-[0.18em] text-gold-ink">
                            残り{x.available}本
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 累計 */}
                <div className="border border-indigo/15 bg-paper-tint/60 px-6 py-6 md:px-7">
                  <h2 className="font-serif text-[15px] font-semibold tracking-[0.06em] text-indigo">
                    累計
                  </h2>
                  <dl className="mt-5 flex flex-col gap-3 text-[12.5px]">
                    <Stat
                      label="売上合計"
                      value={`¥${yen.format(s.allTime.revenue)}`}
                    />
                    <Stat
                      label="注文件数"
                      value={`${yen.format(s.allTime.orders)} 件`}
                    />
                    <Stat label="今日の件数" value={`${s.today.orders} 件`} />
                  </dl>
                  <p className="mt-4 text-[11px] leading-[1.75] text-indigo/50">
                    売上はキャンセル・返金を除いた金額です。日付は日本時間で集計しています。
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-indigo/65">{label}</dt>
      <dd className="font-serif text-[15px] font-semibold tabular-nums text-indigo">
        {value}
      </dd>
    </div>
  );
}

/**
 * 「いま人が動かないと止まるもの」だけを並べる帯。
 * 0 件の項目は出さない — 常時ゼロが並んでいると、本当に出たときに気づけない。
 */
function TodoStrip({
  summary,
}: {
  summary: {
    actionRequired: number;
    cancelRequests: number;
    newContacts: number;
    pendingTradeAccounts: number;
  };
}) {
  const items = [
    {
      n: summary.actionRequired,
      label: "発送待ちの注文",
      href: "/admin/orders?filter=action",
    },
    {
      n: summary.cancelRequests,
      label: "キャンセル依頼",
      href: "/admin/orders?filter=action",
    },
    { n: summary.newContacts, label: "未読のお問い合わせ", href: "/admin/contacts" },
    {
      n: summary.pendingTradeAccounts,
      label: "審査待ちの取扱店",
      href: "/admin/customers",
    },
  ].filter((i) => i.n > 0);

  if (items.length === 0) {
    return (
      <p className="border border-indigo/12 bg-paper/70 px-5 py-3.5 text-[12.5px] text-indigo/65">
        いま対応が必要なものはありません。
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <Link
            href={i.href}
            className="inline-flex items-baseline gap-2.5 border border-gold/55 bg-gold/[0.08] px-4 py-2.5 no-underline transition-colors hover:bg-gold/[0.16]"
          >
            <span className="font-serif text-[15px] font-semibold tabular-nums text-indigo">
              {i.n}
            </span>
            <span className="text-[11.5px] text-indigo/75">{i.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
