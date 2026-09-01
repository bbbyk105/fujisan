import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminTeamRow } from "@/components/fujisan/admin/AdminTeamRow";
import { AdminInviteForm } from "@/components/fujisan/admin/AdminInviteForm";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { AdminNav } from "@/components/fujisan/admin/AdminChrome";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner } from "@/lib/admin";
import { adminListTeamAction } from "@/lib/actions/admin-team";

export const metadata = {
  title: "Admin · Team — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

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
    return <ForbiddenView email={email} />;
  }

  // チーム管理は「メール招待のみ」。一般顧客一覧からの昇格は廃止
  // （誤操作で顧客を権限者にしてしまう事故を防ぐため）。
  const res = await adminListTeamAction({ adminsOnly: true });
  const members = (res.ok ? res.members : []).map((m) => ({
    ...m,
    isSelf: m.id === userId,
  }));

  const ownerCount = members.filter((m) => m.adminRole === "owner").length;
  const staffCount = members.filter((m) => m.adminRole === "staff").length;

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="bg-[#0B1A2E] fujisan-dark-panel text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-jp text-[12px] tracking-[0.34em] text-[#E2C97E]">
                ― 蔵内 ―
              </span>
              <span className="h-px w-10 bg-[#E2C97E]/50" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#E2C97E]/80">
                Team
              </span>
            </div>
            <h1 className="mt-6 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.16] tracking-[0.06em] text-[#F2E4C7]">
              メンバー管理
            </h1>
            <p className="mt-4 max-w-[44ch] text-[13px] leading-[1.85] tracking-[0.02em] text-[#F2E4C7]/72">
              注文・配送を扱う蔵人を、メールでお招きします。招待した方が登録すると、自動で権限が付きます。
            </p>
            <AdminNav current="team" isOwnerUser />
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-2">
            <Kpi label="OWNER" value={`${ownerCount}`} suffix="人" />
            <Kpi label="STAFF" value={`${staffCount}`} suffix="人" />
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {/* メールアドレスで招待 */}
        <div className="mb-10">
          <AdminInviteForm />
        </div>

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
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
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
