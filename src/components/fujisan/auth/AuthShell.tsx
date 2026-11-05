import Link from "next/link";
import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { L } from "@/i18n/Localized";
import { RoleSwitch } from "./RoleSwitch";

type Role = "personal" | "business";

type BrandPanel = {
  titleEn: string;
  titleJp: string;
  textEn: string;
  textJp: string;
};

type Brand = {
  /** 「戻る」リンク先と表記 */
  crumbHref: string;
  crumbEn: string;
  crumbJp: string;
  /**
   * 左の面に載せる案内。右の説明と同じことは書かない（この面はスマホでは出ないので、
   * 申し込みに要る説明は右に置く）。個人か法人か分からない画面では省き、
   * フォームだけを中央に置く。
   */
  panel?: BrandPanel;
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
  brand: Brand;
  children: ReactNode;
  /** 個人/法人の切替タブを出すか。パスワード再設定など mode に該当しない画面では false。 */
  showRoleSwitch?: boolean;
}) {
  const isBusiness = role === "business";
  const { panel } = brand;
  const alignLg = panel ? "lg:self-start" : "";

  return (
    <main className="fjs-ed min-h-screen">
      <FujisanNav />

      <section
        className={`mx-auto grid min-h-screen w-full max-w-[1520px] grid-cols-1 ${
          panel ? "lg:grid-cols-[1.05fr_1fr]" : ""
        }`}
      >
        {/* ===== 案内の面（role で明暗が変わる）===== */}
        {panel ? (
          <aside
            data-tone={isBusiness ? "dark" : undefined}
            className={`hidden lg:block ${PANEL[role]}`}
          >
            {/* 縦中央に置く。下端に寄せると、開いた瞬間は空白の面にしか見えない */}
            <div className="flex h-full flex-col justify-center px-12 py-24 xl:px-16">
              <div className="max-w-[420px]">
                <h2 className="ed-h2">
                  <L en={panel.titleEn} ja={panel.titleJp} />
                </h2>
                <p className="ed-p mt-6">
                  <L en={panel.textEn} ja={panel.textJp} />
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        {/* ===== 入力の面 ===== */}
        <div
          className={`flex flex-col px-6 pb-20 pt-[104px] sm:px-10 md:px-14 lg:pt-[150px] xl:px-20 ${
            panel ? "" : "items-center"
          }`}
        >
          <Link
            href={brand.crumbHref}
            className={`ed-link text-[12.5px] no-underline hover:underline ${
              panel ? "w-fit" : "w-full max-w-[460px]"
            }`}
          >
            <span aria-hidden className="mr-2">
              ←
            </span>
            <L en={brand.crumbEn} ja={brand.crumbJp} />
          </Link>

          {showRoleSwitch && (
            <div
              className={`mt-8 w-full max-w-[460px] self-center lg:mt-10 ${alignLg}`}
            >
              <RoleSwitch active={role} mode={mode} />
            </div>
          )}

          <div
            className={`mt-8 flex w-full max-w-[460px] flex-1 flex-col justify-center self-center ${alignLg}`}
          >
            {children}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

/** フォーム上部の見出し。表題と補足だけにする（上にラベルを重ねない）。 */
export function AuthHeading({
  titleEn,
  titleJp,
  leadEn,
  leadJp,
}: {
  titleEn: string;
  titleJp: string;
} & (
  | { leadEn: string; leadJp: string }
  | { leadEn?: undefined; leadJp?: undefined }
)) {
  return (
    <div className="mb-9">
      <h1 className="ed-h2 text-[clamp(22px,2.6vw,29px)]">
        <L en={titleEn} ja={titleJp} />
      </h1>
      {leadEn && leadJp ? (
        <p className="ed-p mt-4">
          <L en={leadEn} ja={leadJp} />
        </p>
      ) : null}
    </div>
  );
}
