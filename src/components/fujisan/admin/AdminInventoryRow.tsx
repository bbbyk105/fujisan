"use client";

import { useState, useTransition } from "react";
import {
  adminSetStockAction,
  adminUntrackStockAction,
  type InventoryRow,
} from "@/lib/actions/admin-inventory";

const ERRORS: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "本数は 0 以上の整数で入力してください。",
  reserved:
    "決済待ちの引き当てが残っているため、管理をやめられません（完了か期限切れをお待ちください）。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

/**
 * 在庫の 1 行。
 *
 * 数えた本数を入れて保存すると、その SKU の在庫管理が始まる。
 * `reserved`（決済待ち）は編集させない — 進行中の注文が持っているもので、
 * 棚卸しで上書きしてよい値ではない。
 */
export function AdminInventoryRow({ row }: { row: InventoryRow }) {
  const [value, setValue] = useState(String(row.onHand));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = row.tracked
    ? value !== String(row.onHand)
    : value.trim() !== "" && value !== "0";

  const save = () => {
    setError(null);
    setMessage(null);
    const onHand = Number(value);
    if (!Number.isInteger(onHand) || onHand < 0) {
      setError(ERRORS.invalid);
      return;
    }
    startTransition(async () => {
      const res = await adminSetStockAction({
        slug: row.slug,
        ml: row.ml,
        onHand,
      });
      if (res.ok) {
        setMessage("保存しました");
        setTimeout(() => setMessage(null), 2500);
      } else {
        setError(ERRORS[res.error] ?? ERRORS.db);
      }
    });
  };

  const untrack = () => {
    if (
      !window.confirm(
        `${row.productName} ${row.variant}（${row.ml}ml）の在庫管理をやめます。\n以後この SKU は数量無制限で売れるようになります。よろしいですか？`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await adminUntrackStockAction({
        slug: row.slug,
        ml: row.ml,
      });
      if (!res.ok) setError(ERRORS[res.error] ?? ERRORS.db);
    });
  };

  const soldOutByStock = row.tracked && row.available === 0;

  return (
    <li className="border border-[#0B1A2E]/12 bg-white px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-[200px]">
          <p className="font-serif text-[14.5px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            {row.productName} {row.variant}
            <span className="ml-2 font-jp text-[11.5px] text-[#0B1A2E]/55">
              {row.variantJp}
            </span>
          </p>
          <p className="mt-1 text-[11.5px] tracking-[0.06em] text-[#0B1A2E]/60">
            {row.ml}ml
            {row.catalogSoldOut && (
              <span className="ml-2 text-[#8B1A1A]">カタログで販売停止中</span>
            )}
          </p>
        </div>

        {/* 現在の状態 */}
        <div className="flex items-center gap-5 text-[11.5px] tabular-nums">
          {row.tracked ? (
            <>
              <span className="text-[#0B1A2E]/60">
                実在庫 <strong className="text-[13px] text-[#0B1A2E]">{row.onHand}</strong>
              </span>
              <span className="text-[#0B1A2E]/60">
                決済待ち{" "}
                <strong className="text-[13px] text-[#0B1A2E]">{row.reserved}</strong>
              </span>
              <span
                className={
                  soldOutByStock ? "text-[#8B1A1A]" : "text-[#2F5A2F]"
                }
              >
                販売可能{" "}
                <strong className="text-[13px]">{row.available}</strong>
              </span>
            </>
          ) : (
            <span className="border border-[#0B1A2E]/20 px-2.5 py-1 text-[10px] tracking-[0.18em] text-[#0B1A2E]/55">
              管理対象外（無制限）
            </span>
          )}
        </div>

        {/* 編集 */}
        <div className="flex items-center gap-2">
          <label htmlFor={`stock-${row.slug}-${row.ml}`} className="sr-only">
            {row.productName} {row.ml}ml の実在庫
          </label>
          <input
            id={`stock-${row.slug}-${row.ml}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={value}
            disabled={pending}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 border border-[#0B1A2E]/25 bg-white px-3 py-2 text-right text-[13px] tabular-nums text-[#0B1A2E] outline-none focus:border-[#C9A84C] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="border border-[#0B1A2E] bg-[#0B1A2E] px-4 py-2 text-[10.5px] font-semibold tracking-[0.22em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {row.tracked ? "保存" : "管理を開始"}
          </button>
          {row.tracked && (
            <button
              type="button"
              onClick={untrack}
              disabled={pending}
              className="px-2 py-2 text-[10.5px] tracking-[0.18em] text-[#0B1A2E]/50 underline decoration-[#0B1A2E]/20 underline-offset-4 transition-colors hover:text-[#8B1A1A] disabled:opacity-40"
            >
              管理をやめる
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className="mt-3 text-[12px] font-semibold text-[#2F5A2F]">{message}</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-[#8B1A1A]">
          {error}
        </p>
      )}
    </li>
  );
}
