import Link from "next/link";
import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { L } from "@/i18n/Localized";
import { RoleSwitch } from "./RoleSwitch";

type Role = "personal" | "business";

type BrandPanel = {
  /** 大きく薄く敷く漢字（例: 會員 / 卸） */
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

/**
 * role ごとに面の明暗そのものを変える。
 * 似た濃紺を 2 つ用意して分けるより、和紙（個人）と藍（法人）で分けた方が、
 * 入口を取り違えたときに一目で気づける。
 */
const PANEL: Record<Role, string> = {
  personal: "bg-paper-tint",
  business: "bg-indigo",
};

export function AuthShell({
  role,
  mode,
  brand,
  children,
  showRoleSwitch = true,
}: {
  role: Role;
  mode: "login" | "register";
  brand: BrandPanel;
  children: ReactNode;
  /** 個人/法人の切替タブを出すか。パスワード再設定など mode に該当しない画面では false。 */
  showRoleSwitch?: boolean;
}) {
  const isBusiness = role === "business";

  return (
    <main className="fjs-ed min-h-screen">
      <FujisanNav />

      <section className="mx-auto grid min-h-screen w-full max-w-[1520px] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ===== 銘板の面（role で明暗が変わる）===== */}
        <aside
          data-tone={isBusiness ? "dark" : undefined}
          className={`relative hidden overflow-hidden lg:block ${PANEL[role]}`}
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute -right-8 bottom-0 select-none font-jp text-[34vh] font-medium leading-none ${
              isBusiness ? "text-linen/[0.06]" : "text-indigo/[0.05]"
            }`}
          >
            {brand.kanji}
          </span>

          {/* 銘板は縦中央に置く。下端に寄せると、開いた瞬間は
              空白の面にしか見えない */}
          <div className="relative flex h-full flex-col justify-center px-12 py-24 xl:px-16">
            <p className="ed-label">{brand.kickerJp}</p>
            <div className="mt-10 max-w-[420px]">
              <h2 className="ed-h2">
                <L en={brand.titleEn} ja={brand.titleJp} />
              </h2>
              <span aria-hidden className="ed-rule mt-8 block w-12" />
              <p className="ed-p mt-8">
                <L en={brand.textEn} ja={brand.textJp} />
              </p>
            </div>
          </div>
        </aside>

        {/* ===== 入力の面 ===== */}
        <div className="flex flex-col px-6 pb-20 pt-[104px] sm:px-10 md:px-14 lg:pt-[150px] xl:px-20">
          <Link
            href={brand.crumbHref}
            className="ed-link w-fit text-[12.5px] no-underline hover:underline"
          >
            <span aria-hidden className="mr-2">
              ←
            </span>
            <L en={brand.crumbEn} ja={brand.crumbJp} />
          </Link>

          {showRoleSwitch && (
            <div className="mt-8 w-full max-w-[460px] self-center lg:mt-10 lg:self-start">
              <RoleSwitch active={role} mode={mode} />
            </div>
          )}

          <div className="mt-8 flex w-full max-w-[460px] flex-1 flex-col justify-center self-center lg:self-start">
            {children}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

/** フォーム上部の見出し。役割・表題・補足の 3 行だけにする。 */
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
      <p className="ed-label">
        <L
          en={isBusiness ? "Trade account" : "Personal account"}
          ja={isBusiness ? "法人・取扱店" : "個人のお客様"}
        />
        <span aria-hidden className="mx-2.5 opacity-40">
          /
        </span>
        <L en={eyebrowEn} ja={eyebrowJp} />
      </p>

      <h1 className="ed-h2 mt-4 text-[clamp(22px,2.6vw,29px)]">
        <L en={titleEn} ja={titleJp} />
      </h1>
      <p className="ed-p mt-4">
        <L en={leadEn} ja={leadJp} />
      </p>
    </div>
  );
}
