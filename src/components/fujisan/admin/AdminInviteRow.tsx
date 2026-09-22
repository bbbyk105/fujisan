"use client";

import { useState, useTransition } from "react";
import {
  adminRevokeInviteAction,
  type PendingInvite,
} from "@/lib/actions/admin-team";
import { formatDateTimeJp } from "@/lib/format-date";

const ERRORS: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "対象の招待が見つかりません。",
  db: "取り消しに失敗しました。時間をおいて再度お試しください。",
};

/**
 * 招待中の 1 行。
 *
 * 期限切れは**消さずに残して見せる**。黙って消えると「招待したのに反応が無い」と
 * 「期限が切れていた」の区別がつかず、送り直すべきか判断できない。
 */
export function AdminInviteRow({ invite }: { invite: PendingInvite }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const revoke = () => {
    if (
      !window.confirm(
        `${invite.email} 宛の招待を取り消します。\nこのアドレスで登録されても管理権限は付かなくなります。よろしいですか？`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await adminRevokeInviteAction({ email: invite.email });
      if (!res.ok) setError(ERRORS[res.error] ?? ERRORS.db);
    });
  };

  return (
    <li className="border border-[#0B1A2E]/12 bg-white px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-[220px]">
          <p className="text-[13.5px] font-semibold tracking-[0.02em] text-[#0B1A2E]">
            {invite.email}
          </p>
          <p className="mt-1 text-[11.5px] text-[#0B1A2E]/60">
            {invite.adminRole === "owner" ? "蔵元（owner）" : "スタッフ（staff）"}
            <span className="mx-1.5 text-[#0B1A2E]/30">·</span>
            {invite.invitedByEmail} が招待
          </p>
        </div>

        <div className="text-[11.5px] tabular-nums">
          {invite.expired ? (
            <span className="border border-[#8B1A1A]/40 bg-[#8B1A1A]/[0.06] px-2.5 py-1 font-semibold text-[#8B1A1A]">
              期限切れ（{formatDateTimeJp(invite.expiresAt)}）
            </span>
          ) : (
            <span className="text-[#0B1A2E]/65">
              期限{" "}
              <strong className="text-[#0B1A2E]">
                {formatDateTimeJp(invite.expiresAt)}
              </strong>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="px-2 py-2 text-[10.5px] tracking-[0.18em] text-[#0B1A2E]/50 underline decoration-[#0B1A2E]/20 underline-offset-4 transition-colors hover:text-[#8B1A1A] disabled:opacity-40"
        >
          招待を取り消す
        </button>
      </div>

      {invite.expired && (
        <p className="mt-3 text-[11.5px] leading-[1.6] text-[#0B1A2E]/65">
          この招待では権限が付きません。必要なら、上のフォームから同じアドレスに
          招待し直してください（期限が切り直されます）。
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-[#8B1A1A]">
          {error}
        </p>
      )}
    </li>
  );
}
