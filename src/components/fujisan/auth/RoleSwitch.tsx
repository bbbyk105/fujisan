import Link from "next/link";

/**
 * 個人 / 法人の入口を明示する切替。今どちらの入口にいるか、もう一方へどう移るかを
 * 一目で分かるようにする（toB / toC のログイン画面の取り違え防止）。
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
    { key: "personal", href: `${base}/personal`, en: "PERSONAL", jp: "個人のお客様" },
    { key: "business", href: `${base}/business`, en: "TRADE", jp: "法人・取扱店" },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="grid grid-cols-2 border border-[#0B1A2E]/15 bg-[#F1E6CB]/30 p-1"
    >
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            role="tab"
            aria-selected={on}
            className={`flex flex-col items-center gap-0.5 px-4 py-3 text-center no-underline transition-colors ${
              on
                ? "bg-[#0B1A2E] text-[#F8F3E7]"
                : "text-[#0B1A2E]/50 hover:bg-[#F1E6CB]/55 hover:text-[#0B1A2E]"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-[0.24em]">
              {it.en}
            </span>
            <span
              className={`font-jp text-[10.5px] tracking-[0.18em] ${
                on ? "text-[#E2C97E]" : "text-[#C9A84C]/80"
              }`}
            >
              {it.jp}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
