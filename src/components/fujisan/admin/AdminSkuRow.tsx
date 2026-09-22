"use client";

import { useState, useTransition } from "react";
import {
  adminSetStockAction,
  adminUntrackStockAction,
  adminSetPriceAction,
  adminResetPriceAction,
  type AdminSkuRow as Row,
  type AdminProductsError,
} from "@/lib/actions/admin-products";

const ERRORS: Record<AdminProductsError, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid:
    "入力を確認してください（空欄は保存できません。卸価格は小売価格以下である必要があります）。",
  reserved:
    "決済待ちの引き当てが残っているため、管理をやめられません（完了か期限切れをお待ちください）。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

const yen = new Intl.NumberFormat("ja-JP");

/** 整数として読めれば数値、空欄や非整数なら null。 */
function parseIntField(raw: string): number | null {
  const t = raw.trim();
  // 空欄は「0」ではなく「未入力」。Number("") === 0 なので、これを弾かないと
  // 欄を消して保存しただけで値が 0 に書き換わる。
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/**
 * 商品・在庫の 1 行（SKU）。
 *
 * 価格は owner、在庫は staff 以上。staff には価格を読み取り専用で見せる
 * （棚卸し中に「いくらで売っているか」が見えないと突き合わせができない）。
 */
export function AdminSkuRow({
  row,
  canEditPrice,
}: {
  row: Row;
  canEditPrice: boolean;
}) {
  const label = `${row.productName} ${row.variant}（${row.ml}ml）`;

  return (
    <li className="border border-[#0B1A2E]/12 bg-white px-5 py-5 md:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
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
        <StockSummary row={row} />
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-[#0B1A2E]/8 pt-4">
        <PriceSection row={row} canEdit={canEditPrice} label={label} />
        <StockSection row={row} label={label} />
      </div>
    </li>
  );
}

/** 行の右肩に出す現在の在庫。編集欄とは別に、状態をひと目で見せる。 */
function StockSummary({ row }: { row: Row }) {
  if (!row.tracked) {
    return (
      <span className="border border-[#0B1A2E]/20 px-2.5 py-1 text-[10px] tracking-[0.18em] text-[#0B1A2E]/55">
        在庫管理なし（無制限）
      </span>
    );
  }
  const soldOut = row.available === 0;
  return (
    <div className="flex items-center gap-5 text-[11.5px] tabular-nums">
      <span className="text-[#0B1A2E]/60">
        実在庫{" "}
        <strong className="text-[13px] text-[#0B1A2E]">{row.onHand}</strong>
      </span>
      <span className="text-[#0B1A2E]/60">
        決済待ち{" "}
        <strong className="text-[13px] text-[#0B1A2E]">{row.reserved}</strong>
      </span>
      <span
        className={
          soldOut
            ? "text-[#8B1A1A]"
            : row.lowStock
              ? "text-[#8A6D1F]"
              : "text-[#2F5A2F]"
        }
      >
        販売可能 <strong className="text-[13px]">{row.available}</strong>
        {soldOut && <span className="ml-1.5 text-[10px]">完売</span>}
        {row.lowStock && <span className="ml-1.5 text-[10px]">僅少</span>}
      </span>
    </div>
  );
}

function PriceSection({
  row,
  canEdit,
  label,
}: {
  row: Row;
  canEdit: boolean;
  label: string;
}) {
  const [price, setPrice] = useState(String(row.priceJpy));
  const [wholesale, setWholesale] = useState(String(row.wholesalePriceJpy));
  const [caseSize, setCaseSize] = useState(String(row.caseSize));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const source = row.priceOverridden
    ? "管理画面で上書き中"
    : `カタログ価格（¥${yen.format(row.catalogPriceJpy)}）で販売中`;

  if (!canEdit) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[12px] text-[#0B1A2E]/70">
        <span className="text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]/45">
          価格
        </span>
        <span className="tabular-nums">
          小売{" "}
          <strong className="text-[13px] text-[#0B1A2E]">
            ¥{yen.format(row.priceJpy)}
          </strong>
        </span>
        <span className="tabular-nums">
          卸{" "}
          <strong className="text-[13px] text-[#0B1A2E]">
            ¥{yen.format(row.wholesalePriceJpy)}
          </strong>
        </span>
        <span className="tabular-nums">{row.caseSize}本/ケース</span>
        <span className="text-[11px] text-[#0B1A2E]/45">
          {source}・変更は蔵元（owner）のみ
        </span>
      </div>
    );
  }

  const dirty =
    price.trim() !== String(row.priceJpy) ||
    wholesale.trim() !== String(row.wholesalePriceJpy) ||
    caseSize.trim() !== String(row.caseSize);

  const save = () => {
    setError(null);
    setMessage(null);
    const p = parseIntField(price);
    const w = parseIntField(wholesale);
    const c = parseIntField(caseSize);
    if (p === null || w === null || c === null || p < 1 || w < 1 || c < 1) {
      setError(ERRORS.invalid);
      return;
    }
    if (w > p) {
      setError(
        "卸価格（税抜）が小売価格（税込）を上回っています。入力を確認してください。",
      );
      return;
    }
    startTransition(async () => {
      const res = await adminSetPriceAction({
        slug: row.slug,
        ml: row.ml,
        priceJpy: p,
        wholesalePriceJpy: w,
        caseSize: c,
      });
      if (res.ok) {
        setMessage("価格を保存しました");
        setTimeout(() => setMessage(null), 2500);
      } else {
        setError(ERRORS[res.error] ?? ERRORS.db);
      }
    });
  };

  const reset = () => {
    if (
      !window.confirm(
        `${label} の価格をカタログの値に戻します。\n小売 ¥${yen.format(
          row.catalogPriceJpy,
        )} / 卸 ¥${yen.format(
          row.catalogWholesalePriceJpy,
        )} に戻ります。よろしいですか？`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await adminResetPriceAction({ slug: row.slug, ml: row.ml });
      if (res.ok) {
        setPrice(String(row.catalogPriceJpy));
        setWholesale(String(row.catalogWholesalePriceJpy));
        setCaseSize(String(row.catalogCaseSize));
        setMessage("カタログ価格に戻しました");
        setTimeout(() => setMessage(null), 2500);
      } else {
        setError(ERRORS[res.error] ?? ERRORS.db);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <span className="pb-2.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]/45">
          価格
        </span>
        <Field
          id={`price-${row.slug}-${row.ml}`}
          label="小売（税込）"
          unit="円"
          value={price}
          onChange={setPrice}
          disabled={pending}
        />
        <Field
          id={`wholesale-${row.slug}-${row.ml}`}
          label="卸（税抜・1本）"
          unit="円"
          value={wholesale}
          onChange={setWholesale}
          disabled={pending}
        />
        <Field
          id={`case-${row.slug}-${row.ml}`}
          label="ケース入数"
          unit="本"
          value={caseSize}
          onChange={setCaseSize}
          disabled={pending}
          width="w-20"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="border border-[#0B1A2E] bg-[#0B1A2E] px-4 py-2 text-[10.5px] font-semibold tracking-[0.22em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-not-allowed disabled:opacity-35"
        >
          保存
        </button>
        {row.priceOverridden && (
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="px-2 py-2 text-[10.5px] tracking-[0.18em] text-[#0B1A2E]/50 underline decoration-[#0B1A2E]/20 underline-offset-4 transition-colors hover:text-[#0B1A2E] disabled:opacity-40"
          >
            カタログ価格に戻す
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[#0B1A2E]/50">{source}</p>
      <Feedback message={message} error={error} />
    </div>
  );
}

function StockSection({ row, label }: { row: Row; label: string }) {
  const [onHand, setOnHand] = useState(String(row.onHand));
  const [threshold, setThreshold] = useState(String(row.lowStockThreshold));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = parseIntField(onHand);
  // 管理対象外の SKU は 0 本でも「管理を開始」できる必要がある
  // （完売中の銘柄を在庫 0 として登録したいことがある）。
  const dirty =
    parsed === null
      ? false
      : row.tracked
        ? onHand.trim() !== String(row.onHand) ||
          threshold.trim() !== String(row.lowStockThreshold)
        : true;

  const save = () => {
    setError(null);
    setMessage(null);
    const n = parseIntField(onHand);
    const t = parseIntField(threshold);
    if (n === null || t === null) {
      setError(ERRORS.invalid);
      return;
    }
    startTransition(async () => {
      const res = await adminSetStockAction({
        slug: row.slug,
        ml: row.ml,
        onHand: n,
        lowStockThreshold: t,
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
        `${label} の在庫管理をやめます。\n以後この SKU は数量無制限で売れるようになります。よろしいですか？`,
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

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <span className="pb-2.5 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]/45">
          在庫
        </span>
        <Field
          id={`stock-${row.slug}-${row.ml}`}
          label="実在庫"
          unit="本"
          value={onHand}
          onChange={setOnHand}
          disabled={pending}
          width="w-24"
        />
        <Field
          id={`low-${row.slug}-${row.ml}`}
          label="僅少の目安"
          unit="本以下"
          value={threshold}
          onChange={setThreshold}
          disabled={pending}
          width="w-20"
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
      <Feedback message={message} error={error} />
    </div>
  );
}

function Field({
  id,
  label,
  unit,
  value,
  onChange,
  disabled,
  width = "w-28",
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  width?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] tracking-[0.14em] text-[#0B1A2E]/55"
      >
        {label}
      </label>
      <div className="flex items-baseline gap-1.5">
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`${width} border border-[#0B1A2E]/25 bg-white px-3 py-2 text-right text-[13px] tabular-nums text-[#0B1A2E] outline-none focus:border-[#C9A84C] disabled:opacity-60`}
        />
        <span className="text-[11px] text-[#0B1A2E]/50">{unit}</span>
      </div>
    </div>
  );
}

function Feedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  if (!message && !error) return null;
  return (
    <>
      {message && (
        <p className="mt-2 text-[12px] font-semibold text-[#2F5A2F]">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[12px] font-semibold text-[#8B1A1A]">
          {error}
        </p>
      )}
    </>
  );
}
