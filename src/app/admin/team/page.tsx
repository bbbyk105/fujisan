import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminTeamRow } from "@/components/fujisan/admin/AdminTeamRow";
import { AdminInviteForm } from "@/components/fujisan/admin/AdminInviteForm";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner } from "@/lib/admin";
import {
  adminListTeamAction,
  adminListInvitesAction,
} from "@/lib/actions/admin-team";
import { AdminInviteRow } from "@/components/fujisan/admin/AdminInviteRow";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Team",
  description:
    "管理メンバーの招待と権限。",
  path: "/admin/team",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
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
    return <AdminForbidden email={email} />;
  }

  // チーム管理は「メール招待のみ」。一般顧客一覧からの昇格は廃止
  // （誤操作で顧客を権限者にしてしまう事故を防ぐため）。
  const [res, inviteRes] = await Promise.all([
    adminListTeamAction({ adminsOnly: true }),
    adminListInvitesAction(),
  ]);
  const members = (res.ok ? res.members : []).map((m) => ({
    ...m,
    isSelf: m.id === userId,
  }));
  const invites = inviteRes.ok ? inviteRes.invites : [];
  const expiredCount = invites.filter((i) => i.expired).length;

  const ownerCount = members.filter((m) => m.adminRole === "owner").length;
  const staffCount = members.filter((m) => m.adminRole === "staff").length;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="メンバー管理"
        lead="注文・配送を扱う蔵人を、メールでお招きします。招待した方が登録すると、自動で権限が付きます。"
        email={email}
        isOwnerUser
        current="team"
        kpis={
          <>
            <AdminKpi label="OWNER" value={`${ownerCount}`} suffix="人" />
            <AdminKpi label="STAFF" value={`${staffCount}`} suffix="人" />
          </>
        }
      />

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* メールアドレスで招待 */}
        <div className="mb-10">
          <AdminInviteForm />
        </div>

        {/* 招待中（保留中の招待がある時だけ出す。常時 0 件の枠は視界の無駄） */}
        {invites.length > 0 && (
          <div className="mb-10">
            <div className="flex items-baseline gap-4 border-b border-[#0B1A2E]/15 pb-4">
              <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
                招待中
              </span>
              <span className="h-px flex-1 bg-[#0B1A2E]/12" />
              <span className="text-[11px] tracking-[0.22em] text-[#0B1A2E]/55">
                {invites.length} 件
                {expiredCount > 0 && (
                  <span className="ml-2 text-[#8B1A1A]">
                    うち期限切れ {expiredCount} 件
                  </span>
                )}
              </span>
            </div>

            <ul className="mt-6 flex flex-col gap-3">
              {invites.map((inv) => (
                <AdminInviteRow key={inv.email} invite={inv} />
              ))}
            </ul>

            <p className="mt-4 text-[11.5px] leading-[1.75] text-[#0B1A2E]/60">
              招待は <strong>14 日</strong>で失効します。招待した方が登録を済ませると、
              この一覧から消えて「現在のメンバー」に移ります。
            </p>
          </div>
        )}

        {/* メンバー見出し */}
        <div className="flex items-baseline gap-4 border-b border-[#0B1A2E]/15 pb-4">
          <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
            現在のメンバー
          </span>
          <span className="h-px flex-1 bg-[#0B1A2E]/12" />
          <span className="text-[11px] tracking-[0.22em] text-[#0B1A2E]/55">
            {members.length} 名
          </span>
        </div>

        {/* List */}
        {members.length === 0 ? (
          <div className="mt-10 border border-[#0B1A2E]/15 bg-white px-7 py-16 text-center">
            <p className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              まだメンバーはあなただけです。
            </p>
            <p className="mx-auto mt-3 max-w-[44ch] text-[12.5px] leading-[1.85] text-[#0B1A2E]/65">
              上の「メールアドレスで招待」から、蔵人をお招きください。
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {members.map((m) => (
              <AdminTeamRow key={m.id} member={m} />
            ))}
          </ul>
        )}

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
