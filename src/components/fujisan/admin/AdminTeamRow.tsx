"use client";

import { useState, useTransition } from "react";
import type { AdminRole } from "@/lib/admin";
import { adminSetMemberRoleAction } from "@/lib/actions/admin-team";

const ERROR_MESSAGES: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "入力が不正です。",
  self_demote:
    "自分自身を降格することはできません（鍵を失わないための保護）。",
  env_owner_protected:
    "このメンバーは環境変数で owner 指定されています。env で外してから操作してください。",
  last_owner:
    "最後の owner を降格することはできません。先に別の owner を昇格してください。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

const ROLE_LABEL: Record<"owner" | "staff" | "none", string> = {
  owner: "蔵元（owner）",
  staff: "スタッフ（staff）",
  none: "通常顧客（権限なし）",
};

type Member = {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  isEnvOwner: boolean;
  createdAt: Date;
  isSelf: boolean;
};

type Props = {
  member: Member;
};

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * 1メンバーの行。
 * - ロール select で「owner / staff / 権限なし」を選び、保存ボタンで反映
 * - env owner は select 自体を無効化（誤操作防止）
 * - 自分自身は staff/none へ降格不可（サーバー側でも弾く）
 */
export function AdminTeamRow({ member }: Props) {
  const initial: "owner" | "staff" | "none" =
    member.adminRole === "owner"
      ? "owner"
      : member.adminRole === "staff"
        ? "staff"
        : "none";
  const [role, setRole] = useState<"owner" | "staff" | "none">(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEnvLocked = member.isEnvOwner;
  const dirty = role !== initial;

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await adminSetMemberRoleAction({
        userId: member.id,
        role: role === "none" ? null : role,
      });
      if (res.ok) {
        setMessage("保存しました");
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage(ERROR_MESSAGES[res.error] ?? `保存失敗: ${res.error}`);
        // 失敗時は select 値を初期値に戻して整合性を保つ
        setRole(initial);
      }
    });
  };

  return (
    <li className="grid grid-cols-1 items-center gap-4 border border-[#0B1A2E]/12 bg-white px-6 py-5 md:grid-cols-[1.6fr_180px_1fr_auto]">
      <div className="flex flex-col gap-1">
        <span className="font-serif text-[14px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          {member.name || "（名前なし）"}
          {member.isSelf && (
            <span className="ml-2 text-[10px] font-semibold tracking-[0.24em] text-[#C9A84C]">
              YOU
            </span>
          )}
        </span>
        <span className="text-[12px] text-[#0B1A2E]/65">{member.email}</span>
      </div>

      <RoleBadge role={member.adminRole} envOwner={member.isEnvOwner} />

      <div className="flex flex-col gap-2">
        <select
          value={role}
          disabled={isEnvLocked || pending}
          onChange={(e) =>
            setRole(e.target.value as "owner" | "staff" | "none")
          }
          className="w-full border border-[#0B1A2E]/25 bg-white px-3 py-2 text-[12.5px] text-[#0B1A2E] outline-none focus:border-[#C9A84C] disabled:bg-[#0B1A2E]/[0.04] disabled:text-[#0B1A2E]/50"
        >
          <option value="owner">{ROLE_LABEL.owner}</option>
          <option value="staff">{ROLE_LABEL.staff}</option>
          <option value="none">{ROLE_LABEL.none}</option>
        </select>
        <span className="text-[10.5px] text-[#0B1A2E]/55">
          登録: {fmtDate(member.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isEnvLocked || pending}
          className="inline-flex cursor-pointer items-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-2.5 text-[10.5px] font-semibold tracking-[0.26em] text-[#F8F3E7] transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </div>

      {message && (
        <span
          className={`md:col-span-4 text-[11.5px] ${
            message === "保存しました" ? "text-[#2F5A2F]" : "text-[#8B1A1A]"
          }`}
        >
          {message}
        </span>
      )}
    </li>
  );
}

function RoleBadge({
  role,
  envOwner,
}: {
  role: AdminRole;
  envOwner: boolean;
}) {
  const STYLES: Record<
    "owner" | "staff",
    { cls: string; dot: string; label: string }
  > = {
    owner: {
      cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/60 text-[#0B1A2E]",
      dot: "bg-[#C9A84C]",
      label: "OWNER",
    },
    staff: {
      cls: "border-[#5C8A5C]/60 bg-[#5C8A5C]/[0.10] text-[#2F5A2F]",
      dot: "bg-[#5C8A5C]",
      label: "STAFF",
    },
  };
  const s = STYLES[role];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.24em] ${s.cls}`}
      >
        <span aria-hidden className={`h-[5px] w-[5px] rounded-full ${s.dot}`} />
        {s.label}
      </span>
      {envOwner && (
        <span className="border border-[#0B1A2E]/25 bg-[#FAF5E8] px-2 py-1 text-[9px] font-semibold tracking-[0.22em] text-[#0B1A2E]/70">
          ENV
        </span>
      )}
    </div>
  );
}
