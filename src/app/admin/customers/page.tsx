import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { AdminNav } from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isStaffOrAbove, isOwner } from "@/lib/admin";
import { adminListBusinessAccountsAction } from "@/lib/actions/admin-customers";

export const metadata = {
  title: "Admin · Trade Accounts — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminCustomersPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin/customers");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <ForbiddenView email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const params = (await props.searchParams) ?? {};
  const q = params.q?.trim() ?? "";

  const res = await adminListBusinessAccountsAction({ q: q || undefined });
  const accounts = res.ok ? res.accounts : [];

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="bg-[#0B1A2E] fujisan-dark-panel text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-jp text-[12px] tracking-[0.34em] text-[#E2C97E]">
                ― 取扱店 ―
              </span>
              <span className="h-px w-10 bg-[#E2C97E]/50" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#E2C97E]/80">
                Trade Accounts
              </span>
            </div>
            <h1 className="mt-6 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.16] tracking-[0.06em] text-[#F2E4C7]">
              法人・取扱店アカウント
            </h1>
            <p className="mt-4 max-w-[46ch] text-[13px] leading-[1.85] tracking-[0.02em] text-[#F2E4C7]/72">
              法人登録された会社情報の一覧です。会社名・ご担当者・連絡先・所在地を確認できます。
            </p>
            <AdminNav current="customers" isOwnerUser={isOwnerUser} />
          </div>

          <dl className="grid grid-cols-1 gap-y-2">
            <div className="flex flex-col gap-1">
              <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
                ACCOUNTS
              </dt>
              <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
                {accounts.length}
                <span className="ml-1 text-[11px] text-[#F2E4C7]/55">社</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

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
              <li
                key={a.id}
                className="border border-[#0B1A2E]/12 bg-white px-6 py-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                    {a.companyName || "（会社名未登録）"}
                  </h2>
                  <span
                    className={`text-[10px] font-semibold tracking-[0.24em] ${
                      a.emailVerified ? "text-[#2F5A2F]" : "text-[#8B1A1A]"
                    }`}
                  >
                    {a.emailVerified ? "メール認証済" : "メール未認証"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="ご担当者" value={a.contactName} />
                  <Field label="メール" value={a.email} />
                  <Field label="電話" value={a.phone} />
                  <Field label="ご登録" value={fmtDate(a.createdAt)} />
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Field label="所在地" value={a.address} />
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}

        {/* Footer nav */}
        <div className="mt-12 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
            >
              ← 注文管理へ
            </Link>
            {isOwnerUser && (
              <Link
                href="/admin/team"
                className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
              >
                メンバー管理へ
              </Link>
            )}
          </div>
          <LogoutButton />
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/50">
        {label}
      </span>
      <span className="text-[13px] leading-[1.6] text-[#0B1A2E]/85">
        {value || "—"}
      </span>
    </div>
  );
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function ForbiddenView({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />
      <section className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-7 pt-[140px] pb-24 text-center md:pt-[180px]">
        <p className="font-serif text-[10px] font-semibold tracking-[0.34em] text-[#8B1A1A]">
          STAFF ACCESS REQUIRED
        </p>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
          このページは蔵スタッフ専用です。
        </h1>
        <p className="mt-5 text-[13px] leading-[1.85] text-[#1D2432]/78">
          現在のログイン:{" "}
          <span className="font-semibold">{email ?? "（未ログイン）"}</span>
        </p>
        <div className="mt-9">
          <LogoutButton />
        </div>
      </section>
      <FujisanFooter />
    </main>
  );
}
