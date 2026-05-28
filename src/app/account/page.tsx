import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { getSession } from "@/lib/session";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Account — FUJISAN SAKE",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login/personal");
  }

  const user = session.user as {
    name?: string;
    email: string;
    emailVerified?: boolean;
    role?: string;
    companyName?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  const isBusiness = user.role === "business";

  return (
    <main className="min-h-screen bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />

      {/* ===== Banner (themed per account type) ===== */}
      <section
        className={`${
          isBusiness ? "bg-[#0B1A2E]" : "bg-[#1B130A]"
        } fujisan-dark-panel text-[#F2E4C7]`}
      >
        <div className="mx-auto max-w-[960px] px-7 pb-12 pt-[124px] md:px-12 md:pb-14 md:pt-[150px]">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] ${
              isBusiness
                ? "bg-[#E2C97E] text-[#0B1A2E]"
                : "border border-[#E2C97E]/55 text-[#E2C97E]"
            }`}
          >
            {isBusiness ? "法人・取扱店 · TRADE" : "個人のお客様 · PERSONAL"}
          </span>

          <h1 className="mt-6 font-serif text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.15] tracking-[0.04em] text-[#F2E4C7]">
            <L
              en={`Welcome back, ${user.companyName || user.name || "to Fujisan"}.`}
              ja={
                user.companyName || user.name
                  ? `${user.companyName || user.name}さま、おかえりなさい。`
                  : "おかえりなさい。"
              }
            />
          </h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/70">
            <span>{user.email}</span>
            <span className="text-[#F2E4C7]/30">·</span>
            <span className={user.emailVerified ? "text-[#9FCB9F]" : "text-[#E2C97E]"}>
              {user.emailVerified ? (
                <L en="Email verified" ja="メール認証済み" />
              ) : (
                <L en="Email not verified" ja="メール未認証" />
              )}
            </span>
          </p>
        </div>
      </section>

      {/* ===== Quick actions ===== */}
      <section className="mx-auto max-w-[960px] px-7 py-14 md:px-12 md:py-16">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/60">
            QUICK ACTIONS
          </span>
          <span className="h-px w-8 bg-[#C9A84C]/55" />
          <span className="font-jp text-[11px] tracking-[0.26em] text-[#C9A84C]/90">
            よく使う操作
          </span>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isBusiness ? (
            <>
              <ActionCard
                num="01"
                href="/shop/business"
                titleEn="View wholesale pricing"
                titleJp="卸価格・発注"
                descEn="Per-bottle and per-case trade pricing for every label."
                descJp="全銘柄の1本・1ケースあたりの卸価格を確認。"
              />
              <ActionCard
                num="02"
                href="/contact"
                titleEn="Contact your trade desk"
                titleJp="お問い合わせ・ご相談"
                descEn="Quotes, lead times, brewery visits — in JA / EN."
                descJp="お見積り・納期・蔵見学のご相談（日本語・英語）。"
              />
            </>
          ) : (
            <>
              <ActionCard
                num="01"
                href="/shop/personal"
                titleEn="Continue shopping"
                titleJp="買い物を続ける"
                descEn="Single bottles, delivered with care to your door."
                descJp="720ml の単品を、ご自宅まで丁寧にお届け。"
              />
              <ActionCard
                num="02"
                href="/shipping"
                titleEn="Shipping & delivery"
                titleJp="配送・送料について"
                descEn="Cool-chain delivery, fees, and timing across Japan."
                descJp="全国へのクール便・送料・お届け時期について。"
              />
            </>
          )}
        </div>
      </section>

      {/* ===== Account details ===== */}
      <section className="mx-auto max-w-[960px] px-7 pb-24 md:px-12">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/60">
            ACCOUNT DETAILS
          </span>
          <span className="h-px w-8 bg-[#C9A84C]/55" />
          <span className="font-jp text-[11px] tracking-[0.26em] text-[#C9A84C]/90">
            登録情報
          </span>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-x-14 gap-y-9 sm:grid-cols-2">
          <Detail labelEn="NAME" labelJp="ご担当者・お名前" value={user.name} />
          <Detail labelEn="EMAIL" labelJp="メールアドレス" value={user.email} />
          {isBusiness && (
            <>
              <Detail
                labelEn="COMPANY"
                labelJp="会社・店舗名"
                value={user.companyName}
              />
              <Detail labelEn="PHONE" labelJp="電話番号" value={user.phone} />
              <Detail labelEn="ADDRESS" labelJp="所在地" value={user.address} />
            </>
          )}
        </dl>

        <div className="mt-12 border-t border-[#0B1A2E]/12 pt-8">
          <LogoutButton />
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

function ActionCard({
  num,
  href,
  titleEn,
  titleJp,
  descEn,
  descJp,
}: {
  num: string;
  href: string;
  titleEn: string;
  titleJp: string;
  descEn: string;
  descJp: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 border border-[#0B1A2E]/14 bg-[#F1E6CB]/35 px-7 py-7 no-underline transition-colors hover:border-[#0B1A2E]/30 hover:bg-[#F1E6CB]/60"
    >
      <div className="flex items-center justify-between">
        <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
          {num}
        </span>
        <span
          aria-hidden
          className="text-[14px] text-[#0B1A2E]/50 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-[#C9A84C]"
        >
          →
        </span>
      </div>
      <div>
        <h3 className="font-serif text-[17px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          <L en={titleEn} ja={titleJp} />
        </h3>
        <p className="mt-2 text-[12.5px] leading-[1.7] text-[#1D2432]/72">
          <L en={descEn} ja={descJp} />
        </p>
      </div>
    </Link>
  );
}

function Detail({
  labelEn,
  labelJp,
  value,
}: {
  labelEn: string;
  labelJp: string;
  value?: string | null;
}): ReactNode {
  return (
    <div className="flex flex-col gap-2 border-t border-[#0B1A2E]/12 pt-4">
      <dt className="flex items-baseline gap-3 text-[10px] font-semibold tracking-[0.32em] text-[#0F1F36]/60">
        <span>{labelEn}</span>
        <span className="font-jp tracking-[0.24em] text-[#C9A84C]/85">
          {labelJp}
        </span>
      </dt>
      <dd className="font-serif text-[16px] tracking-[0.02em] text-[#0B1A2E]">
        {value || "—"}
      </dd>
    </div>
  );
}
