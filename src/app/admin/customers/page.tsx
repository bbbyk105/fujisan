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
import { getEffectiveAdminRole, isStaffOrAbove, isOwner } from "@/lib/admin";
import {
  adminListBusinessAccountsAction,
  adminListPersonalCustomersAction,
} from "@/lib/actions/admin-customers";
import { AdminPersonalRow } from "@/components/fujisan/admin/AdminPersonalRow";
import { AdminTradeRow } from "@/components/fujisan/admin/AdminTradeRow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Trade Accounts",
  description:
    "法人・取扱店アカウントの一覧。",
  path: "/admin/customers",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; tab?: string }>;

/** 法人（取扱店）と個人でタブを分ける。扱う情報も判断も別物なので混ぜない。 */
const TABS = [
  { key: "trade", label: "取扱店（法人）" },
  { key: "personal", label: "個人のお客様" },
] as const;

export default async function AdminCustomersPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin/customers");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const params = (await props.searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const tab = params.tab === "personal" ? "personal" : "trade";

  // 開いているタブの側だけを引く（両方引くと、見ない側の分だけ表示が遅くなる）。
  const [res, personalRes] = await Promise.all([
    adminListBusinessAccountsAction({ q: q || undefined }),
    tab === "personal"
      ? adminListPersonalCustomersAction({ q: q || undefined })
      : Promise.resolve(null),
  ]);
  const accounts = res.ok ? res.accounts : [];
  const personals = personalRes?.ok ? personalRes.customers : [];
  // 「未申請（旧アカウント）」も承認しないと卸価格が出ないので審査待ちに数える。
  const awaitingReview = accounts.filter(
    (a) => a.tradeStatus === "pending" || a.tradeStatus === null,
  ).length;

  const tabHref = (key: string) => {
    const next = new URLSearchParams();
    if (key !== "trade") next.set("tab", key);
    if (q) next.set("q", q);
    const qs = next.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  };

  return (
    <main className="flex min-h-screen flex-col bg-paper text-indigo">
      <FujisanNav />

      <AdminHeader
        title={tab === "personal" ? "個人のお客様" : "法人・取扱店アカウント"}
        lead={
          tab === "personal" ? (
            "ご登録いただいている個人のお客様と、ご注文の実績です。"
          ) : (
            <>
              法人登録された会社情報と、取扱口座の審査状況です。
              <strong className="font-semibold text-gold">
                承認するまで卸価格は表示されません。
              </strong>
              免許番号と業態を確認のうえ、承認または見送りを選んでください。
            </>
          )
        }
        email={u?.email}
        isOwnerUser={isOwnerUser}
        current="customers"
        kpis={
          tab === "personal" ? (
            <>
              <AdminKpi
                label="CUSTOMERS"
                value={`${personals.length}`}
                suffix="名"
              />
              <AdminKpi
                label="ご購入あり"
                value={`${personals.filter((c) => c.orderCount > 0).length}`}
                suffix="名"
              />
            </>
          ) : (
            <>
              <AdminKpi label="取扱店" value={`${accounts.length}`} suffix="社" />
              <AdminKpi label="審査待ち" value={`${awaitingReview}`} suffix="社" />
            </>
          )
        }
      />

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* タブ */}
        <nav
          aria-label="顧客の種別"
          className="mb-6 flex flex-wrap items-center gap-2 border-b border-indigo/15 pb-4"
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={tabHref(t.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 border px-4 py-2 text-[10.5px] font-semibold tracking-[0.2em] no-underline transition-colors ${
                  active
                    ? "border-indigo bg-indigo text-paper-card"
                    : "border-indigo/20 bg-transparent text-indigo/70 hover:border-indigo/50 hover:text-indigo"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <form
          action="/admin/customers"
          className="flex flex-wrap items-center gap-2 border-b border-indigo/15 pb-4"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="会社名 / 担当者 / メールで検索"
            className="w-[280px] max-w-full border border-indigo/25 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="border border-indigo bg-indigo px-4 py-2 text-[10.5px] font-semibold tracking-[0.26em] text-paper-card hover:bg-indigo-lift"
          >
            検索
          </button>
          {q && (
            <Link
              href="/admin/customers"
              className="text-[10.5px] font-semibold tracking-[0.26em] text-indigo/65 no-underline hover:text-indigo"
            >
              クリア
            </Link>
          )}
        </form>

        {/* List */}
        {tab === "personal" ? (
          personals.length === 0 ? (
            <div className="mt-10 border border-indigo/15 bg-white px-7 py-16 text-center">
              <p className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo">
                {q
                  ? `「${q}」に一致する個人のお客様はいません。`
                  : "まだ個人のお客様の登録はありません。"}
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-6 flex flex-col gap-3">
                {personals.map((c) => (
                  <AdminPersonalRow key={c.id} customer={c} />
                ))}
              </ul>
              <p className="mt-4 text-[11.5px] leading-[1.75] text-indigo/55">
                ご注文の件数と金額は、キャンセル・返金を除いた集計です（ダッシュボードと同じ規則）。
                新しく登録された順に最大 200 名まで表示します。
              </p>
            </>
          )
        ) : accounts.length === 0 ? (
          <div className="mt-10 border border-indigo/15 bg-white px-7 py-16 text-center">
            <p className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo">
              {q
                ? `「${q}」に一致する法人アカウントはありません。`
                : "まだ法人アカウントの登録はありません。"}
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.85] text-indigo/65">
              法人のお客様が /register/business から登録すると、ここに会社情報が表示されます。
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {accounts.map((a) => (
              <AdminTradeRow key={a.id} account={a} />
            ))}
          </ul>
        )}

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
