import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
  AdminSubNav,
} from "@/components/fujisan/admin/AdminChrome";
import { AdminContactList } from "@/components/fujisan/admin/AdminContactList";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isStaffOrAbove, isOwner } from "@/lib/admin";
import { adminListContactsAction } from "@/lib/actions/admin-contacts";
import { buildMetadata } from "@/lib/seo";
import { CONTACT_LIST_LIMIT } from "@/data/fujisan-contact";
import { loginPathFor } from "@/lib/safe-redirect";

export const metadata = buildMetadata({
  title: "Admin · Enquiries",
  description:
    "お問い合わせの管理。",
  path: "/admin/contacts",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: string }>;

const VIEWS = [
  { href: "/admin/contacts", label: "未対応・対応中", openOnly: true },
  { href: "/admin/contacts?view=all", label: "すべて", openOnly: false },
];

/**
 * `info@` の転送先。Cloudflare Email Routing のルールと揃える。
 * サーバーのこのファイルに置いて管理者の画面へだけ渡す（共有の定数にすると公開の JS に載る）。
 */
const REPLY_GMAIL_ACCOUNT = "mtfujipharmacy@gmail.com";

export default async function AdminContactsPage(props: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  const params = (await props.searchParams) ?? {};
  if (!session) redirect(loginPathFor("/admin/contacts", params));

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;
  const isOwnerUser = isOwner(role);

  // 既定は対応が残っている分だけ。対応を終えたものは一覧から消え、「すべて」で確認できる。
  const openOnly = params.view !== "all";

  const res = await adminListContactsAction({ openOnly });
  const messages = res.ok ? res.messages : [];

  return (
    <main className="flex min-h-screen flex-col bg-paper text-indigo">
      <FujisanNav />

      <AdminHeader
        title="お問い合わせ管理"
        lead="サイトのフォームから届いたお問い合わせです。メール通知が届かなかった場合も、ここには残ります。"
        email={u?.email}
        isOwnerUser={isOwnerUser}
        current="contacts"
        kpis={
          // 読み込めなかったときに 0 件と出すと、対応が無いように見える。
          res.ok ? (
            <>
              <AdminKpi
                label="未対応"
                value={`${res.counts.new}`}
                suffix="件"
                tone={res.counts.new > 0 ? "alert" : undefined}
              />
              <AdminKpi
                label="対応中"
                value={`${res.counts.inProgress}`}
                suffix="件"
              />
            </>
          ) : undefined
        }
      />

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        <AdminSubNav
          label="表示の切り替え"
          items={VIEWS.map((v) => ({
            href: v.href,
            label: v.label,
            active: v.openOnly === openOnly,
          }))}
        />

        {!res.ok ? (
          <p
            role="alert"
            className="mt-8 border border-crimson/40 bg-crimson/6 px-4 py-3 text-[13px] text-crimson"
          >
            お問い合わせの読み込みに失敗しました。時間をおいて再度お試しください。
          </p>
        ) : (
          <>
            {/*
              検索パラメータだけの移動では行が作り直されないので、表示ごとに key を分ける。
              分けないと、移動の確認で「変更は失われます」に同意しても選択が残る。
            */}
            <AdminContactList
              key={openOnly ? "open" : "all"}
              messages={messages}
              openOnly={openOnly}
              replyAccount={REPLY_GMAIL_ACCOUNT}
            />
            {messages.length >= CONTACT_LIST_LIMIT && (
              <p className="mt-6 text-[13px] leading-[1.8] text-indigo/65">
                新しい順に {CONTACT_LIST_LIMIT} 件まで表示しています。
              </p>
            )}
          </>
        )}

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
