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
import { adminListBusinessAccountsAction } from "@/lib/actions/admin-customers";
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

type SearchParams = Promise<{ q?: string }>;

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

  const res = await adminListBusinessAccountsAction({ q: q || undefined });
  const accounts = res.ok ? res.accounts : [];
  // 「未申請（旧アカウント）」も承認しないと卸価格が出ないので審査待ちに数える。
  const awaitingReview = accounts.filter(
    (a) => a.tradeStatus === "pending" || a.tradeStatus === null,
  ).length;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="法人・取扱店アカウント"
        lead={
          <>
            法人登録された会社情報と、取扱口座の審査状況です。
            <strong className="font-semibold text-[#E2C97E]">
              承認するまで卸価格は表示されません。
            </strong>
            免許番号と業態を確認のうえ、承認または見送りを選んでください。
          </>
        }
        email={u?.email}
        isOwnerUser={isOwnerUser}
        current="customers"
        kpis={
          <>
            <AdminKpi label="ACCOUNTS" value={`${accounts.length}`} suffix="社" />
            <AdminKpi label="審査待ち" value={`${awaitingReview}`} suffix="社" />
          </>
        }
      />

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* Search */}
        <form
          action="/admin/customers"
          className="flex flex-wrap items-center gap-2 border-b border-[#0B1A2E]/15 pb-4"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="会社名 / 担当者 / メールで検索"
            className="w-[280px] max-w-full border border-[#0B1A2E]/25 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-[#C9A84C]"
          />
          <button
            type="submit"
            className="border border-[#0B1A2E] bg-[#0B1A2E] px-4 py-2 text-[10.5px] font-semibold tracking-[0.26em] text-paper-card hover:bg-[#1D2432]"
          >
            検索
          </button>
          {q && (
            <Link
              href="/admin/customers"
              className="text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/65 no-underline hover:text-[#0B1A2E]"
            >
              クリア
            </Link>
          )}
        </form>

        {/* List */}
        {accounts.length === 0 ? (
          <div className="mt-10 border border-[#0B1A2E]/15 bg-white px-7 py-16 text-center">
            <p className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              {q
                ? `「${q}」に一致する法人アカウントはありません。`
                : "まだ法人アカウントの登録はありません。"}
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.85] text-[#0B1A2E]/65">
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
