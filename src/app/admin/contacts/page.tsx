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
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const params = (await props.searchParams) ?? {};
  const openOnly = params.open === "1";

  const res = await adminListContactsAction({ openOnly });
  const messages = res.ok ? res.messages : [];
  const unhandled = messages.filter((m) => m.status === "new").length;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="お問い合わせ管理"
        lead="サイトのフォームから届いたご連絡の一覧です。メール通知が届かなかった場合も、受領はこの画面が正となります。"
        email={u?.email}
        isOwnerUser={isOwnerUser}
        current="contacts"
        kpis={
          <>
            <AdminKpi label="UNHANDLED" value={`${unhandled}`} suffix="件" />
            <AdminKpi label="SHOWN" value={`${messages.length}`} suffix="件" />
          </>
        }
      />

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

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
