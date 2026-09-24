"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useLocale } from "@/i18n/useLocale";
import { inputCls } from "./ui";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  /** 入力欄の見た目。既定は認証フォーム共通の `inputCls` */
  inputClassName?: string;
};

/**
 * パスワード欄。右端の目のボタンで、入力した文字を見せる／隠すを切り替える。
 *
 * - ボタンは `type="button"`（Enter や押下でフォームを送信しない）
 * - 名前は「パスワードを表示」で固定し、今どちらかは `aria-pressed` で伝える
 *   （押すたびに名前が入れ替わると、読み上げで状態と操作の区別がつかない）
 * - Edge が独自に出す目のボタン（::-ms-reveal）は隠す。出すと目が二つ並ぶ
 */
export function PasswordInput({
  inputClassName = inputCls,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const locale = useLocale();

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClassName} pr-11 [&::-ms-reveal]:hidden`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={locale === "en" ? "Show password" : "パスワードを表示"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute bottom-0 right-0 top-0 flex w-11 items-center justify-center text-indigo/50 transition-colors hover:text-indigo"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </svg>
  );
}
