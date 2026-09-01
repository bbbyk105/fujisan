"use client";

import { useState, useTransition } from "react";
import {
  adminUpdateStockAction,
  adminUpdatePriceAction,
  type AdminSkuItem,
} from "@/lib/actions/admin-products";

const yen = new Intl.NumberFormat("ja-JP");

const ERRORS: Record<string, string> = {
  unauth: "権限がありません（再ログインしてください）",
  forbidden: "この操作の権限がありません",
  invalid: "入力値が正しくありません",
  db: "保存に失敗しました",
};

function Field({
  label,
  value,
  onChange,
  suffix,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9.5px] font-semibold tracking-[0.24em] text-[#0B1A2E]/60">
        {label}
      </span>
      <span className="inline-flex items-baseline gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 border-b border-[#0B1A2E]/30 bg-transparent pb-1 text-right font-serif text-[15px] font-semibold tracking-[0.02em] text-[#0B1A2E] outline-none focus:border-[#0B1A2E] disabled:text-[#0B1A2E]/45"
        />
        <span className="text-[11px] text-[#0B1A2E]/55">{suffix}</span>
      </span>
    </label>
  );
}

/**
 * SKU 1 行の編集。
 * - 在庫は staff 以上が変更できる（日々の入出庫）。
 * - 価格は owner のみ（特商法表示に関わるため）。`canEditPrice` で切り替える。
 */
export function AdminSkuRow({
  sku,
  canEditPrice,
}: {
  sku: AdminSkuItem;
  canEditPrice: boolean;
}) {
  const [stock, setStock] = useState(String(sku.stockQty ?? 0));
  const [threshold, setThreshold] = useState(String(sku.lowStockThreshold));
  const [price, setPrice] = useState(String(sku.priceJpy));
  const [wholesale, setWholesale] = useState(String(sku.wholesalePriceJpy));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2800);
  };

  const saveStock = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await adminUpdateStockAction({
        skuId: sku.id,
        stockQty: Number(stock),
        lowStockThreshold: Number(threshold),
      });
      flash(res.ok ? "在庫を保存しました" : `保存失敗: ${ERRORS[res.error] ?? res.error}`);
    });
  };

  const savePrice = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await adminUpdatePriceAction({
        skuId: sku.id,
        priceJpy: Number(price),
        wholesalePriceJpy: Number(wholesale),
      });
      flash(res.ok ? "価格を保存しました" : `保存失敗: ${ERRORS[res.error] ?? res.error}`);
    });
  };

  const outOfStock = sku.soldOut;
  const low = sku.lowStock;

  return (
    <article className="border border-[#0B1A2E]/15 bg-paper-card/70 px-6 py-6 md:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[16px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
            {sku.name}{" "}
            <span className="text-[#0B1A2E]/55">{sku.variant}</span>{" "}
            <span className="text-[13px] text-[#0B1A2E]/70">{sku.ml}ml</span>
          </h2>
          <p className="mt-1.5 text-[11px] tracking-[0.1em] text-[#0B1A2E]/50">
            {sku.id} · 1ケース {sku.caseSize}本
          </p>
        </div>

        <div className="flex items-center gap-2">
          {outOfStock ? (
            <span className="border border-crimson/45 bg-crimson/8 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-crimson">
              完売 · 購入不可
            </span>
          ) : low ? (
            <span className="border border-[#C9A84C]/60 bg-[#C9A84C]/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-[#8A6D1F]">
              在庫僅少
            </span>
          ) : (
            <span className="border border-[#0B1A2E]/20 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-[#0B1A2E]/60">
              販売中
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[auto_auto_1fr] md:items-end md:gap-8">
        <div className="flex flex-wrap items-end gap-6">
          <Field label="在庫" value={stock} onChange={setStock} suffix="本" />
          <Field
            label="僅少しきい値"
            value={threshold}
            onChange={setThreshold}
            suffix="本"
          />
          <button
            type="button"
            onClick={saveStock}
            disabled={pending}
            className="cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-2.5 text-[10px] font-semibold tracking-[0.24em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-50"
          >
            在庫を保存
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-6 md:border-l md:border-[#0B1A2E]/12 md:pl-8">
          <Field
            label="小売（税込）"
            value={price}
            onChange={setPrice}
            suffix="円"
            disabled={!canEditPrice}
          />
          <Field
            label="卸（税抜）"
            value={wholesale}
            onChange={setWholesale}
            suffix="円"
            disabled={!canEditPrice}
          />
          {canEditPrice ? (
            <button
              type="button"
              onClick={savePrice}
              disabled={pending}
              className="cursor-pointer border border-[#0B1A2E]/40 px-5 py-2.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E] transition-colors hover:border-[#0B1A2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              価格を保存
            </button>
          ) : (
            <p className="text-[10.5px] leading-[1.7] tracking-[0.06em] text-[#0B1A2E]/50">
              価格の変更は蔵元（owner）のみ
            </p>
          )}
        </div>

        <p
          aria-live="polite"
          className="text-[11.5px] tracking-[0.06em] text-[#0B1A2E]/70 md:text-right"
        >
          {message ?? (
            <span className="text-[#0B1A2E]/45">
              ケース売価 ¥{yen.format(sku.wholesalePriceJpy * sku.caseSize)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
