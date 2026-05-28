"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { L } from "@/i18n/Localized";

export function AccountNavLink({ mobile = false }: { mobile?: boolean }) {
  const { data } = useSession();
  const pathname = usePathname();
  const signedIn = Boolean(data);
  // 取扱店の文脈にいる時は、未ログインなら取扱店ログインへ誘導する。
  const inTradeContext = pathname.includes("/business");
  const href = signedIn
    ? "/account"
    : inTradeContext
      ? "/login/business"
      : "/login/personal";

  if (mobile) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between border-b border-[#0F1F36]/10 py-4 text-[13px] font-semibold tracking-[0.14em] text-[#0F1F36]/82 no-underline transition-colors hover:text-[#0F1F36]"
      >
        <span>
          {signedIn ? (
            <L en="ACCOUNT" ja="アカウント" />
          ) : (
            <L en="SIGN IN" ja="ログイン" />
          )}
        </span>
        <span aria-hidden className="text-[10px] tracking-[0.3em] text-[#C9A84C]">
          ●
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-[#0F1F36]/75 no-underline transition-colors duration-300 hover:text-[#0F1F36]"
    >
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M2.5 14c0-3 2.5-4.5 5.5-4.5S13.5 11 13.5 14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      {signedIn ? (
        <L en="ACCOUNT" ja="アカウント" />
      ) : (
        <L en="SIGN IN" ja="ログイン" />
      )}
    </Link>
  );
}
