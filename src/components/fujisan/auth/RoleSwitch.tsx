import Link from "next/link";
import { L } from "@/i18n/Localized";

/**
 * 個人 / 法人の入口を明示する切替。今どちらの入口にいるか、もう一方へどう移るかを
 * 一目で分かるようにする（toB / toC のログイン画面の取り違え防止）。
 *
 * 枠で囲ったタブにはしない。選ばれている側の下に太い罫を引くだけで、
 * 「いまここ」は十分に伝わる。
 */
export function RoleSwitch({
  active,
  mode,
}: {
  active: "personal" | "business";
  mode: "login" | "register";
}) {
  const base = mode === "login" ? "/login" : "/register";
  const items = [
    {
      key: "personal",
      href: `${base}/personal`,
      label: <L en="Personal" ja="個人のお客様" />,
    },
    {
      key: "business",
      href: `${base}/business`,
      label: <L en="Trade" ja="法人・取扱店" />,
    },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="grid grid-cols-2 border-b border-[var(--ed-rule)]"
    >
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            role="tab"
            aria-selected={on}
            className={`-mb-px flex items-center justify-center border-b-2 px-4 py-3.5 text-center text-[13px] font-semibold tracking-[0.06em] no-underline transition-colors ${
              on
                ? "border-indigo text-indigo"
                : "border-transparent text-indigo/45 hover:text-indigo/75"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
