import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { AdminOrderRow } from "@/components/fujisan/admin/AdminOrderRow";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { getSession } from "@/lib/session";
import {
  getEffectiveAdminRole,
  isOwner,
  isStaffOrAbove,
} from "@/lib/admin";
import { adminListOrdersAction } from "@/lib/actions/admin-orders";
import type { OrderStatus } from "@/db/orders-schema";

export const metadata = {
  title: "Admin · Orders — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getSession();
  const sessUser = session?.user as
    | { id?: string; email?: string }
    | undefined;
  const email = sessUser?.email;

  if (!session) {
    redirect("/login/personal?next=/admin/orders");
  }
  const role = await getEffectiveAdminRole({
    userId: sessUser?.id,
    email,
  });
  if (!isStaffOrAbove(role)) {
    return <ForbiddenView email={email} />;
  }
  const isOwnerUser = isOwner(role);

  const res = await adminListOrdersAction();
  const orders = res.ok ? res.orders : [];

  // KPIごとの集計（簡易ダッシュボード）
  const counts = orders.reduce<Record<OrderStatus, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
  );
  const inFlight = counts.pending + counts.confirmed + counts.preparing;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="bg-[#0B1A2E] fujisan-dark-panel text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-7 pt-[124px] pb-10 md:flex-row md:items-end md:justify-between md:px-12 md:pt-[150px] md:pb-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 bg-[#E2C97E] px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]">
                ADMIN · 蔵 内
              </span>
              <span className="inline-flex items-center gap-2 border border-[#E2C97E]/55 px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-[#E2C97E]">
                {isOwnerUser ? "OWNER · 蔵元" : "STAFF · 蔵スタッフ"}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#F2E4C7]">
              注文・配送の管理
            </h1>
            <p className="mt-3 text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/70">
              {email}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/admin/customers"
                className="group/cust inline-flex items-center gap-3 border border-[#E2C97E]/45 px-5 py-3 text-[10.5px] font-semibold tracking-[0.3em] text-[#E2C97E] no-underline transition-colors hover:border-[#E2C97E] hover:bg-[#E2C97E]/[0.08]"
              >
                取扱店アカウント
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/cust:translate-x-1"
                >
                  →
                </span>
              </Link>
              {isOwnerUser && (
                <Link
                  href="/admin/team"
                  className="group/team inline-flex items-center gap-3 border border-[#E2C97E]/55 bg-[#E2C97E]/[0.08] px-5 py-3 text-[10.5px] font-semibold tracking-[0.3em] text-[#E2C97E] no-underline transition-colors hover:border-[#E2C97E] hover:bg-[#E2C97E]/15"
                >
                  メンバー管理
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover/team:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 md:gap-x-10">
            <Kpi label="進行中" value={`${inFlight}`} suffix="件" />
            <Kpi label="発送済" value={`${counts.shipped}`} suffix="件" />
            <Kpi label="お届け済" value={`${counts.delivered}`} suffix="件" />
            <Kpi
              label="売上合計"
              value={`¥${new Intl.NumberFormat("ja-JP").format(totalRevenue)}`}
            />
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {orders.length === 0 ? (
          <div className="border border-dashed border-[#0B1A2E]/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              まだ注文がありません。
            </p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[12.5px] leading-[1.75] text-[#0B1A2E]/70">
              顧客が /checkout から確定すると、ここに表示されステータスや追跡番号を更新できます。
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[120px_1fr_120px_100px_120px_28px] items-center gap-4 border-b border-[#0B1A2E]/15 px-6 pb-3 text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/55">
              <span>注文番号</span>
              <span>顧客</span>
              <span>注文日</span>
              <span className="text-right">合計</span>
              <span>ステータス</span>
              <span />
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {orders.map((o) => (
                <AdminOrderRow key={o.id} order={o} />
              ))}
            </ul>
          </>
        )}

        <div className="mt-12 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-8">
          <Link
            href="/account"
            className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
          >
            ← マイアカウントへ
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
      <dd className="font-serif text-[16px] tracking-[0.02em] text-[#F2E4C7] md:text-[18px]">
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
          ADMIN ACCESS REQUIRED
        </p>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
          このページは蔵元の管理者専用です。
        </h1>
        <p className="mt-5 text-[13px] leading-[1.85] text-[#1D2432]/78">
          現在のログイン:{" "}
          <span className="font-semibold">{email ?? "（未ログイン）"}</span>
          <br />
          別アカウントでログインし直してください。
        </p>
        <div className="mt-9 flex items-center justify-center gap-6">
          <Link
            href="/account"
            className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
          >
            ← アカウントへ
          </Link>
          <LogoutButton />
        </div>
      </section>
      <FujisanFooter />
    </main>
  );
}
