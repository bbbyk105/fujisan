import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { AdminDashboardView } from "@/components/fujisan/admin/AdminDashboardView";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { adminDashboardAction } from "@/lib/actions/admin-dashboard";
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
        title="ダッシュボード"
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
                label="今月の注文"
                value={`${s.month.orders}`}
                suffix="件"
              />
              <AdminKpi
                label="発送待ち"
                value={`${s.actionRequired}`}
                suffix="件"
                tone={s.actionRequired > 0 ? "alert" : undefined}
              />
            </>
          ) : null
        }
      />

      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-14 md:px-12 md:pt-16">
        <AdminDashboardView summary={s} />
        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
