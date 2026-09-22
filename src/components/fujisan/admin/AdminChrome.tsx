import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";

/** 管理画面ヘッダーの KPI 1項目（暗色パネル上での表示）。 */
export function AdminKpi({
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

/** 管理画面の区画。ナビの現在地の指定に使う。 */
export type AdminSection =
  | "dashboard"
  | "orders"
  | "products"
  | "customers"
  | "contacts"
  | "team";

const SECTIONS: Array<{
  key: AdminSection;
  href: string;
  label: string;
  ownerOnly?: boolean;
}> = [
  { key: "dashboard", href: "/admin", label: "ダッシュボード" },
  { key: "orders", href: "/admin/orders", label: "注文・配送" },
  { key: "products", href: "/admin/products", label: "商品・在庫" },
  { key: "customers", href: "/admin/customers", label: "取扱店アカウント" },
  { key: "contacts", href: "/admin/contacts", label: "お問い合わせ" },
  { key: "team", href: "/admin/team", label: "メンバー管理", ownerOnly: true },
];

/** 管理画面どうしを行き来するナビ。owner 専用の項目は staff に出さない。 */
export function AdminNav({
  current,
  isOwnerUser,
}: {
  current: AdminSection;
  isOwnerUser: boolean;
}) {
  return (
    <nav
      aria-label="管理メニュー"
      className="mt-5 flex flex-wrap items-center gap-2.5"
    >
      {SECTIONS.filter((s) => !s.ownerOnly || isOwnerUser).map((s) => {
        const active = s.key === current;
        return (
          <Link
            key={s.key}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-3 border px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.24em] no-underline transition-colors ${
              active
                ? "border-[#E2C97E] bg-[#E2C97E] text-[#0B1A2E]"
                : "border-[#E2C97E]/45 text-[#E2C97E] hover:border-[#E2C97E] hover:bg-[#E2C97E]/[0.08]"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * 管理者以外がアクセスしたときの画面。
 * ログイン中のアドレスを必ず出す — 「入れない」とき、どのアカウントで
 * 入っているのかが分からないと直しようがない。
 */
export function AdminForbidden({ email }: { email: string | undefined }) {
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

/** 管理画面の共通ヘッダー（暗色パネル）。右側に KPI を差し込む。 */
export function AdminHeader({
  title,
  lead,
  email,
  isOwnerUser,
  current,
  kpis,
}: {
  title: string;
  /** 見出しの下に出す短い説明。無ければ出さない。 */
  lead?: React.ReactNode;
  email: string | undefined;
  isOwnerUser: boolean;
  current: AdminSection;
  kpis?: React.ReactNode;
}) {
  return (
    <section className="fujisan-dark-panel bg-[#0B1A2E] text-[#F2E4C7]">
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
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-[56ch] text-[12.5px] leading-[1.85] tracking-[0.02em] text-[#F2E4C7]/72">
              {lead}
            </p>
          )}
          <p className="mt-3 text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/70">
            {email}
          </p>
          <AdminNav current={current} isOwnerUser={isOwnerUser} />
        </div>

        {kpis ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 md:gap-x-10">
            {kpis}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

/** 管理画面の下端。ログアウトだけを置く（行き来はヘッダーのナビに集約）。 */
export function AdminFooterBar() {
  return (
    <div className="mt-12 flex items-center justify-end border-t border-[#0B1A2E]/12 pt-8">
      <LogoutButton />
    </div>
  );
}
