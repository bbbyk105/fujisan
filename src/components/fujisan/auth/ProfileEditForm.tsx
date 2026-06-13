"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { updateMyProfileAction } from "@/lib/actions/account";
import { L } from "@/i18n/Localized";

type Initial = {
  name: string;
  email: string;
  companyName: string;
  phone: string;
  address: string;
};

type Notice =
  | { tone: "ok"; text: string }
  | { tone: "err"; text: string }
  | null;

const inputCls =
  "w-full border-b border-[#0B1A2E]/25 bg-transparent py-2.5 text-[15px] text-[#0B1A2E] outline-none transition-colors placeholder:text-[#0B1A2E]/35 focus:border-[#C9A84C]";

/**
 * ダッシュボードの「登録情報」を編集するフォーム。
 * 法人は会社名・電話・所在地も編集できる。メールアドレスはここでは変更不可。
 */
export function ProfileEditForm({
  isBusiness,
  initial,
}: {
  isBusiness: boolean;
  initial: Initial;
}) {
  const [name, setName] = useState(initial.name);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const dirty =
    name !== initial.name ||
    (isBusiness &&
      (companyName !== initial.companyName ||
        phone !== initial.phone ||
        address !== initial.address));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    if (!name.trim()) {
      setNotice({ tone: "err", text: "お名前を入力してください。" });
      return;
    }
    setPending(true);
    const res = await updateMyProfileAction({
      name,
      ...(isBusiness ? { companyName, phone, address } : {}),
    });
    setPending(false);
    if (!res.ok) {
      const msg: Record<string, string> = {
        unauth: "ログインが切れています。再度ログインしてください。",
        invalid: "入力内容をご確認ください。",
        db: "保存に失敗しました。時間をおいて再度お試しください。",
      };
      setNotice({ tone: "err", text: msg[res.error] ?? "保存に失敗しました。" });
      return;
    }
    setNotice({ tone: "ok", text: "登録情報を更新しました。" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#0B1A2E]/12 bg-paper/65 px-7 py-8 md:px-10 md:py-10"
    >
      <div className="grid grid-cols-1 gap-x-14 gap-y-7 sm:grid-cols-2">
        <FieldBlock labelEn="NAME" labelJp="ご担当者・お名前" required>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </FieldBlock>

        {/* メールは変更不可（変更にはサポート対応が必要）。読み取り専用で表示。 */}
        <FieldBlock labelEn="EMAIL" labelJp="メールアドレス">
          <p className="border-b border-transparent py-2.5 text-[15px] text-[#0B1A2E]/60">
            {initial.email}
          </p>
        </FieldBlock>

        {isBusiness && (
          <>
            <FieldBlock labelEn="COMPANY" labelJp="会社・店舗名">
              <input
                type="text"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputCls}
                placeholder="株式会社〇〇商店"
              />
            </FieldBlock>
            <FieldBlock labelEn="PHONE" labelJp="電話番号">
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="03-xxxx-xxxx"
              />
            </FieldBlock>
            <div className="sm:col-span-2">
              <FieldBlock labelEn="ADDRESS" labelJp="所在地">
                <input
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                  placeholder="静岡県〇〇市…"
                />
              </FieldBlock>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3 text-[10.5px] font-semibold tracking-[0.28em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "保存中…" : "変更を保存"}
        </button>
        {notice && (
          <span
            className={`text-[12px] ${
              notice.tone === "ok" ? "text-[#2F5A2F]" : "text-[#8B1A1A]"
            }`}
          >
            {notice.text}
          </span>
        )}
      </div>

      {!isBusiness && (
        <p className="mt-5 text-[11.5px] leading-[1.7] text-[#0B1A2E]/55">
          <L
            en="Email changes require support. Contact us if you need to update your address on file."
            ja="メールアドレスの変更はサポート対応が必要です。ご希望の場合はお問い合わせください。"
          />
        </p>
      )}
    </form>
  );
}

function FieldBlock({
  labelEn,
  labelJp,
  required,
  children,
}: {
  labelEn: string;
  labelJp: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/55">
        <L en={labelEn} ja={labelJp} />
        {required && <span className="ml-1 text-[#8B1A1A]">*</span>}
      </span>
      {children}
    </div>
  );
}
