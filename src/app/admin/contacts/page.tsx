import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { AdminContactRow } from "@/components/fujisan/admin/AdminContactRow";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isStaffOrAbove, isOwner } from "@/lib/admin";
import { adminListContactsAction } from "@/lib/actions/admin-contacts";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Enquiries",
  description:
    "お問い合わせの管理。",
  path: "/admin/contacts",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ open?: string }>;

export default async function AdminContactsPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin/contacts");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <ForbiddenView email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const params = (await props.searchParams) ?? {};
  const openOnly = params.open === "1";

  const res = await adminListContactsAction({ openOnly });
  const messages = res.ok ? res.messages : [];
  const unhandled = messages.filter((m) => m.status === "new").length;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="fujisan-dark-panel bg-[#0B1A2E] text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-jp text-[12px] tracking-[0.34em] text-[#E2C97E]">
                ― お問い合わせ ―
              </span>
              <span className="h-px w-10 bg-[#E2C97E]/50" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#E2C97E]/80">
                Enquiries
              </span>
            </div>
            <h1 className="mt-6 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.16] tracking-[0.06em] text-[#F2E4C7]">
              お問い合わせ管理
            </h1>
            <p className="mt-4 max-w-[46ch] text-[13px] leading-[1.85] tracking-[0.02em] text-[#F2E4C7]/72">
              サイトのフォームから届いたご連絡の一覧です。メール通知が届かなかった場合も、
              受領はこの画面が正となります。
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-2">
            <div className="flex flex-col gap-1">
              <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
                UNHANDLED
              </dt>
              <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
                {unhandled}
                <span className="ml-1 text-[11px] text-[#F2E4C7]/55">件</span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
                SHOWN
              </dt>
              <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
                {messages.length}
                <span className="ml-1 text-[11px] text-[#F2E4C7]/55">件</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#0B1A2E]/15 pb-4">
          <Link
            href="/admin/contacts"
            aria-current={!openOnly ? "page" : undefined}
            className={`border px-4 py-2 text-[10.5px] font-semibold tracking-[0.26em] no-underline transition-colors ${
              openOnly
                ? "border-[#0B1A2E]/25 text-[#0B1A2E]/70 hover:border-[#0B1A2E]/60"
                : "border-[#0B1A2E] bg-[#0B1A2E] text-paper-card"
            }`}
          >
            すべて
          </Link>
          <Link
            href="/admin/contacts?open=1"
            aria-current={openOnly ? "page" : undefined}
            className={`border px-4 py-2 text-[10.5px] font-semibold tracking-[0.26em] no-underline transition-colors ${
              openOnly
                ? "border-[#0B1A2E] bg-[#0B1A2E] text-paper-card"
                : "border-[#0B1A2E]/25 text-[#0B1A2E]/70 hover:border-[#0B1A2E]/60"
            }`}
          >
            未対応・対応中のみ
          </Link>
        </div>

        {!res.ok && (
          <p
            role="alert"
            className="mt-6 border border-[#8B1A1A]/40 bg-[#8B1A1A]/6 px-4 py-3 text-[12.5px] text-[#8B1A1A]"
          >
            お問い合わせの読み込みに失敗しました。時間をおいて再度お試しください。
          </p>
        )}

        {res.ok && messages.length === 0 ? (
          <div className="mt-10 border border-[#0B1A2E]/15 bg-white px-7 py-16 text-center">
            <p className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              {openOnly
                ? "未対応・対応中のお問い合わせはありません。"
                : "まだお問い合わせは届いていません。"}
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.85] text-[#0B1A2E]/65">
              /contact のフォームから送信されたご連絡が、ここに新しい順で表示されます。
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {messages.map((m) => (
              <AdminContactRow key={m.id} message={m} />
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
            <Link
              href="/admin/inventory"
              className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
            >
              在庫へ
            </Link>
            <Link
              href="/admin/customers"
              className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
            >
              取扱店アカウントへ
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
