import Link from "next/link";
import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { L } from "@/i18n/Localized";
import { RoleSwitch } from "./RoleSwitch";

type Role = "personal" | "business";

type BrandPanel = {
  /** 大きく薄く敷く漢字ウォーターマーク（例: 會員 / 卸） */
  kanji: string;
  kickerJp: string;
  titleEn: string;
  titleJp: string;
  textEn: string;
  textJp: string;
  /** 「戻る」リンク先と表記 */
  crumbHref: string;
  crumbEn: string;
  crumbJp: string;
};

/** role ごとにパネルの色相を変え、個人(温かみ) / 法人(濃紺) を一目で区別する。 */
const THEME: Record<Role, { panel: string; accent: string; accentDim: string }> =
  {
    personal: { panel: "bg-[#1B130A]", accent: "#E2C97E", accentDim: "#E2C97E" },
    business: { panel: "bg-[#0B1A2E]", accent: "#D7B46A", accentDim: "#D7B46A" },
  };

export function AuthShell({
  role,
  mode,
  brand,
  children,
}: {
  role: Role;
  mode: "login" | "register";
  brand: BrandPanel;
  children: ReactNode;
}) {
  const theme = THEME[role];

  return (
    <main className="min-h-screen bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />

      <section className="mx-auto grid min-h-screen w-full max-w-[1520px] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ===== Brand panel (themed per role) ===== */}
        <aside
          className={`fujisan-dark-panel relative hidden overflow-hidden lg:block ${theme.panel}`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 select-none"
          >
            <span
              className="fujisan-breathe absolute -right-6 bottom-2 font-jp text-[34vh] font-semibold leading-none"
              style={{ color: `${theme.accent}0D` }}
            >
              {brand.kanji}
            </span>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.accent}73, transparent)`,
            }}
          />
          <div className="relative flex h-full flex-col justify-between px-12 pb-16 pt-[150px] xl:px-16">
            <span
              className="font-jp text-[12px] tracking-[0.34em]"
              style={{ color: theme.accent }}
            >
              {brand.kickerJp}
            </span>
            <div className="max-w-[440px]">
              <h2 className="font-serif text-[clamp(26px,2.6vw,40px)] font-semibold leading-[1.2] tracking-[0.04em] text-[#F2E4C7]">
                <L en={brand.titleEn} ja={brand.titleJp} />
              </h2>
              <div
                className="mt-7 h-px w-12"
                style={{ background: `${theme.accent}8C` }}
              />
              <p className="mt-7 text-[13.5px] leading-[1.9] text-[#F2E4C7]/72">
                <L en={brand.textEn} ja={brand.textJp} />
              </p>
            </div>
          </div>
        </aside>

        {/* ===== Form panel ===== */}
        <div className="flex flex-col px-6 pb-20 pt-[104px] sm:px-10 md:px-14 lg:pt-[150px] xl:px-20">
          <Link
            href={brand.crumbHref}
            className="group inline-flex w-fit items-center gap-2 text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60 no-underline transition-colors hover:text-[#0B1A2E]"
          >
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:-translate-x-1"
            >
              ←
            </span>
            <L en={brand.crumbEn} ja={brand.crumbJp} />
          </Link>

          <div className="mt-8 w-full max-w-[460px] self-center lg:mt-10 lg:self-start">
            <RoleSwitch active={role} mode={mode} />
          </div>

          <div className="mt-8 flex w-full max-w-[460px] flex-1 flex-col justify-center self-center lg:self-start">
            {children}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

/** フォーム上部の見出し（role バッジ + 小見出し + タイトル + 補足）。 */
export function AuthHeading({
  role,
  eyebrowEn,
  eyebrowJp,
  titleEn,
  titleJp,
  leadEn,
  leadJp,
}: {
  role: Role;
  eyebrowEn: string;
  eyebrowJp: string;
  titleEn: string;
  titleJp: string;
  leadEn: string;
  leadJp: string;
}) {
  const isBusiness = role === "business";

  return (
    <div className="mb-9">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold tracking-[0.22em] ${
          isBusiness
            ? "bg-[#0B1A2E] text-[#E2C97E]"
            : "border border-[#C9A84C]/55 bg-[#F1E6CB]/55 text-[#0B1A2E]"
        }`}
      >
        {isBusiness ? "法人・取扱店 · TRADE" : "個人のお客様 · PERSONAL"}
      </span>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/60">
          {eyebrowEn}
        </span>
        <span className="h-px w-8 bg-[#C9A84C]/55" />
        <span className="font-jp text-[11px] tracking-[0.26em] text-[#C9A84C]/90">
          {eyebrowJp}
        </span>
      </div>
      <h1 className="mt-4 font-serif text-[clamp(26px,3vw,34px)] font-semibold leading-[1.2] tracking-[0.05em] text-[#0B1A2E]">
        <L en={titleEn} ja={titleJp} />
      </h1>
      <p className="mt-4 text-[13px] leading-[1.8] text-[#1D2432]/75">
        <L en={leadEn} ja={leadJp} />
      </p>
    </div>
  );
}
