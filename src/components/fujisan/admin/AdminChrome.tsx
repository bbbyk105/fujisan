import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";

/**
 * 管理画面の数字 1 項目。
 *
 * 数字は暗色の帯に小さく詰めない。和紙の上に大きく置き、ラベルは読める大きさにする
 * （以前は 9px・字間 0.32em のラベルと 16px の数字を暗色の帯に押し込んでいて、
 * いちばん見たい売上が画面でいちばん読みにくかった）。
 */
export function AdminKpi({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  /** 対応が要る数字だけ色を付ける。0 件なら付けない */
  tone?: "alert";
}) {
  return (
    <div className="border-t border-indigo/15 pt-3">
      <dt className="text-[12.5px] text-indigo/60">{label}</dt>
      <dd
        className={`mt-1.5 font-serif text-[26px] font-medium leading-none tabular-nums tracking-[0.01em] md:text-[30px] ${
          tone === "alert" ? "text-gold-ink" : "text-indigo"
        }`}
      >
        {value}
        {suffix && (
          <span className="ml-1 text-[13px] font-normal text-indigo/55">
            {suffix}
          </span>
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
  { key: "customers", href: "/admin/customers", label: "顧客" },
  { key: "contacts", href: "/admin/contacts", label: "お問い合わせ" },
  { key: "team", href: "/admin/team", label: "メンバー", ownerOnly: true },
];

/**
 * 管理画面どうしを行き来するタブ。owner 専用の項目は staff に出さない。
 *
 * 枠付きのボタンを並べない。文字の明暗と下線だけで現在地を示す
 * （金の枠を 6 つ並べると、どれが今の画面か一目で分からなかった）。
 */
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
      className="-mx-7 overflow-x-auto px-7 md:mx-0 md:px-0"
    >
      <ul className="flex min-w-max gap-7 md:gap-9">
        {SECTIONS.filter((s) => !s.ownerOnly || isOwnerUser).map((s) => {
          const active = s.key === current;
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px block border-b-2 pb-3.5 pt-1 text-[14px] no-underline transition-colors ${
                  active
                    ? "border-gold font-semibold text-linen"
                    : "border-transparent text-linen/60 hover:text-linen"
                }`}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
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
    <main className="flex min-h-screen flex-col bg-paper text-indigo">
      <FujisanNav />
      <section className="mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center px-7 pb-24 pt-[140px] md:pt-[180px]">
        <p className="text-[13px] font-semibold text-crimson">
          管理者専用のページです
        </p>
        <h1 className="mt-4 font-serif text-[26px] font-medium leading-[1.35] text-indigo">
          このアカウントには管理権限がありません。
        </h1>
        <p className="mt-5 text-[14px] leading-[1.9] text-indigo/80">
          現在のログイン:{" "}
          <span className="font-semibold">{email ?? "（未ログイン）"}</span>
          <br />
          管理者のアカウントでログインし直してください。
        </p>
        <div className="mt-9 flex items-center gap-8">
          <Link
            href="/account"
            className="text-[14px] text-indigo underline decoration-indigo/30 underline-offset-4 hover:decoration-gold"
          >
            アカウントへ戻る
          </Link>
          <LogoutButton />
        </div>
      </section>
      <FujisanFooter />
    </main>
  );
}

/**
 * 管理画面の共通ヘッダー。
 *
 * 暗色の帯には「どこにいるか」（見出し・権限・タブ）だけを置く。
 * 数字（kpis）は帯の下の和紙の面に大きく出す。
 */
export function AdminHeader({
  title,
  lead,
  email,
  isOwnerUser,
  current,
  kpis,
  wide = false,
}: {
  title: string;
  /** 見出しの下に出す短い説明。無ければ出さない。 */
  lead?: React.ReactNode;
  email: string | undefined;
  isOwnerUser: boolean;
  current: AdminSection;
  kpis?: React.ReactNode;
  /** 表の広いページ（注文・商品）。本文の幅と揃えないと左端がずれる */
  wide?: boolean;
}) {
  const width = wide ? "max-w-[1480px]" : "max-w-[1280px]";
  return (
    <>
      <section className="bg-indigo text-linen">
        <div className={`mx-auto ${width} px-7 pt-[112px] md:px-12 md:pt-[134px]`}>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <div>
              <p className="text-[12.5px] text-linen/60">
                管理画面
                <span aria-hidden className="mx-2 text-linen/30">
                  ／
                </span>
                {isOwnerUser ? "蔵元（オーナー）" : "蔵スタッフ"}
              </p>
              <h1 className="mt-2 font-serif text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.3] text-linen">
                {title}
              </h1>
            </div>
            <p className="pb-1 text-[12.5px] text-linen/55">{email}</p>
          </div>

          <div className="mt-7 border-b border-linen/15">
            <AdminNav current={current} isOwnerUser={isOwnerUser} />
          </div>
        </div>
      </section>

      {lead || kpis ? (
        <section className="bg-paper">
          <div className={`mx-auto ${width} px-7 pt-10 md:px-12 md:pt-12`}>
            {lead ? (
              <p className="max-w-[62ch] text-[14px] leading-[1.9] text-indigo/75">
                {lead}
              </p>
            ) : null}
            {kpis ? (
              <dl
                className={`grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-4 md:gap-x-12 ${
                  lead ? "mt-9" : ""
                }`}
              >
                {kpis}
              </dl>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

/** 管理画面の下端。ログアウトだけを置く（行き来はヘッダーのタブに集約）。 */
export function AdminFooterBar() {
  return (
    <div className="mt-16 flex items-center justify-end border-t border-indigo/12 pt-8">
      <LogoutButton />
    </div>
  );
}
