import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminTeamRow } from "@/components/fujisan/admin/AdminTeamRow";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner } from "@/lib/admin";
import { adminListTeamAction } from "@/lib/actions/admin-team";

export const metadata = {
  title: "Admin · Team — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; tab?: string }>;

export default async function AdminTeamPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const sessUser = session?.user as
    | { id?: string; email?: string }
    | undefined;
  const email = sessUser?.email;
  const userId = sessUser?.id;

  if (!session) {
    redirect("/login/personal?next=/admin/team");
  }
  const role = await getEffectiveAdminRole({ userId, email });
  if (!isOwner(role)) {
    return <ForbiddenView email={email} />;
  }

  const params = (await props.searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  // tab=all で全ユーザー検索（昇格候補）、それ以外は admin だけ
  const adminsOnly = params.tab !== "all";

  const res = await adminListTeamAction({ adminsOnly, q: q || undefined });
  const members = (res.ok ? res.members : []).map((m) => ({
    ...m,
    isSelf: m.id === userId,
  }));

  const ownerCount = members.filter((m) => m.adminRole === "owner").length;
  const staffCount = members.filter((m) => m.adminRole === "staff").length;

  return (
    <main className="flex min-h-screen flex-col bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="bg-[#0B1A2E] fujisan-dark-panel text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 bg-[#E2C97E] px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]">
                ADMIN · 蔵 内
              </span>
              <span className="inline-flex items-center gap-2 border border-[#E2C97E]/55 px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#E2C97E]">
                OWNER · 蔵元
              </span>
            </div>
            <h1 className="mt-5 font-serif text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#F2E4C7]">
              メンバー管理
            </h1>
            <p className="mt-3 text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/70">
              注文・配送を扱うスタッフをここで増減できます。
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-2">
            <Kpi label="OWNER" value={`${ownerCount}`} suffix="人" />
            <Kpi label="STAFF" value={`${staffCount}`} suffix="人" />
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* Filter tabs + search */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0B1A2E]/15 pb-4">
          <div className="flex gap-1 text-[11px] font-semibold tracking-[0.28em]">
            <TabLink active={adminsOnly} href="/admin/team" label="メンバーのみ" />
            <TabLink
              active={!adminsOnly}
              href="/admin/team?tab=all"
              label="全ユーザー（昇格候補）"
            />
          </div>
          <form action="/admin/team" className="flex items-center gap-2">
            {!adminsOnly && <input type="hidden" name="tab" value="all" />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="名前 / メールで検索"
              className="w-[260px] border border-[#0B1A2E]/25 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-[#C9A84C]"
            />
            <button
              type="submit"
              className="border border-[#0B1A2E] bg-[#0B1A2E] px-4 py-2 text-[10.5px] font-semibold tracking-[0.26em] text-[#F8F3E7] hover:bg-[#1D2432]"
            >
              検索
            </button>
            {q && (
              <Link
                href={adminsOnly ? "/admin/team" : "/admin/team?tab=all"}
                className="text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/65 no-underline hover:text-[#0B1A2E]"
              >
                クリア
              </Link>
            )}
          </form>
        </div>

        {/* List */}
        {members.length === 0 ? (
          <div className="mt-10 border border-dashed border-[#0B1A2E]/25 bg-[#FAF5E8]/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              {adminsOnly
                ? "まだメンバーはあなただけです。"
                : q
                  ? `「${q}」に一致するユーザーが見つかりませんでした。`
                  : "ユーザーがいません。"}
            </p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[12.5px] leading-[1.75] text-[#0B1A2E]/70">
              {adminsOnly
                ? "「全ユーザー（昇格候補）」タブから、登録済みのお客様を staff / owner に昇格できます。"
                : "顧客に /register/personal で登録してもらってから、ここで昇格してください。"}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-[11px] font-semibold tracking-[0.28em] text-[#0B1A2E]/55">
              {members.length} 名表示中
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {members.map((m) => (
                <AdminTeamRow key={m.id} member={m} />
              ))}
            </ul>
          </>
        )}

        {/* Footer nav */}
        <div className="mt-12 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-8">
          <Link
            href="/admin/orders"
            className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
          >
            ← 注文管理へ
          </Link>
          <LogoutButton />
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-3 py-2 no-underline transition-colors ${
        active
          ? "border-[#C9A84C] text-[#0B1A2E]"
          : "border-transparent text-[#0B1A2E]/55 hover:text-[#0B1A2E]"
      }`}
    >
      {label}
    </Link>
  );
}

function Kpi({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
        {label}
      </dt>
      <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
        {value}
        {suffix && (
          <span className="ml-1 text-[11px] text-[#F2E4C7]/55">{suffix}</span>
        )}
      </dd>
    </div>
  );
}

function ForbiddenView({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />
      <section className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-7 pt-[140px] pb-24 text-center md:pt-[180px]">
        <p className="font-serif text-[10px] font-semibold tracking-[0.34em] text-[#8B1A1A]">
          OWNER ACCESS REQUIRED
        </p>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
          このページは蔵元（owner）専用です。
        </h1>
        <p className="mt-5 text-[13px] leading-[1.85] text-[#1D2432]/78">
          現在のログイン:{" "}
          <span className="font-semibold">{email ?? "（未ログイン）"}</span>
        </p>
        <div className="mt-9 flex items-center justify-center gap-6">
          <Link
            href="/admin/orders"
            className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
          >
            ← 注文管理へ
          </Link>
          <LogoutButton />
        </div>
      </section>
      <FujisanFooter />
    </main>
  );
}
