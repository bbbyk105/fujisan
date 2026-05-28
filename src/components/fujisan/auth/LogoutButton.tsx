"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { L } from "@/i18n/Localized";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="group/btn inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] disabled:opacity-50"
    >
      <span className="relative pb-1">
        {loading ? (
          <L en="SIGNING OUT…" ja="ログアウト中…" />
        ) : (
          <L en="SIGN OUT" ja="ログアウト" />
        )}
        <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/btn:bg-[#C9A84C]" />
      </span>
      <span
        aria-hidden
        className="transition-transform duration-500 group-hover/btn:translate-x-1 group-hover/btn:text-[#C9A84C]"
      >
        →
      </span>
    </button>
  );
}
