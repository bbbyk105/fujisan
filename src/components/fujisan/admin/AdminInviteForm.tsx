"use client";

import { useState, type FormEvent } from "react";
import { adminInviteByEmailAction } from "@/lib/actions/admin-team";
import { isEmailLike } from "@/lib/validation/forms";

type Notice =
  | { tone: "ok"; text: string }
  | { tone: "err"; text: string }
  | null;

/**
 * メールアドレスでチームに招待するフォーム（owner 専用画面に置く）。
 * 既存ユーザーなら即時付与、未登録なら招待メールを送る。
 */
export function AdminInviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    if (!isEmailLike(email)) {
      setNotice({ tone: "err", text: "メールアドレスの形式が正しくありません。" });
      return;
    }
    setPending(true);
    const res = await adminInviteByEmailAction({ email: email.trim(), role });
    setPending(false);
    if (!res.ok) {
      const msg: Record<string, string> = {
        unauth: "ログインが切れています。再度ログインしてください。",
        forbidden: "権限がありません。",
        invalid: "入力が不正です。",
        db: "処理に失敗しました。時間をおいて再度お試しください。",
      };
      setNotice({ tone: "err", text: msg[res.error] ?? "失敗しました。" });
      return;
    }
    setEmail("");
    setNotice({
      tone: "ok",
      text:
        res.status === "granted"
          ? "登録済みユーザーだったため、その場で権限を付与しました。"
          : "招待メールを送信しました。相手がこのメールで登録すると自動で権限が付きます。",
    });
  };

  const roleCls =
    "border border-[#0B1A2E]/25 bg-white px-3 py-2.5 text-[12.5px] text-[#0B1A2E] outline-none focus:border-[#C9A84C]";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border border-[#0B1A2E]/12 bg-white px-6 py-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-[14px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          メールアドレスで招待
        </h2>
        <p className="text-[11.5px] leading-[1.6] text-[#0B1A2E]/60">
          まだ登録していない相手も招待できます。未登録なら招待メールを送り、登録時に自動で権限が付きます。
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
          className="min-w-0 flex-1 border-b border-[#0B1A2E]/30 bg-transparent px-1 py-2.5 text-[14px] text-[#0B1A2E] outline-none placeholder:text-[#0B1A2E]/40 focus:border-[#C9A84C] sm:border sm:px-3"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "owner" | "staff")}
          className={`${roleCls} sm:w-[170px]`}
        >
          <option value="staff">スタッフ（staff）</option>
          <option value="owner">蔵元（owner）</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-6 py-2.5 text-[10.5px] font-semibold tracking-[0.26em] text-[#F8F3E7] transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "送信中…" : "招待する"}
        </button>
      </div>

      {notice && (
        <p
          className={`text-[11.5px] leading-[1.6] ${
            notice.tone === "ok" ? "text-[#2F5A2F]" : "text-[#8B1A1A]"
          }`}
        >
          {notice.text}
        </p>
      )}
    </form>
  );
}
