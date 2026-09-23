"use client";

import { useState } from "react";
import { signOutAction } from "@/lib/actions/auth";
import { L } from "@/i18n/Localized";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOutAction();
        // フルリロードでナビのセッション表示をクリア状態に同期
        window.location.href = "/";
      }}
      className="group/btn inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[11.5px] font-semibold tracking-[0.12em] text-indigo disabled:opacity-50"
    >
      <span className="relative pb-1">
        {loading ? (
          <L en="SIGNING OUT…" ja="ログアウト中…" />
        ) : (
          <L en="Sign out" ja="ログアウト" />
        )}
        <span className="absolute inset-x-0 -bottom-0 h-px bg-indigo/50 transition-all duration-500 group-hover/btn:bg-gold" />
      </span>
    </button>
  );
}
