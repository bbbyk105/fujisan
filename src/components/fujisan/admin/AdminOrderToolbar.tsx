"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { adminExportOrdersCsvAction } from "@/lib/actions/admin-orders";

/**
 * 注文一覧の期間絞り込みと CSV 書き出し。
 *
 * **絞り込みと書き出しは同じ条件で動く。** 画面で絞ったのに CSV が全件
 * 出てくると、会計に渡す前に必ず突き合わせが要る。
 */
export function AdminOrderToolbar({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, startExport] = useTransition();

  /** 期間だけ差し替えて、ステータスの絞り込み（filter）は保つ。 */
  const apply = (nextFrom: string, nextTo: string) => {
    const next = new URLSearchParams(params.toString());
    if (nextFrom) next.set("from", nextFrom);
    else next.delete("from");
    if (nextTo) next.set("to", nextTo);
    else next.delete("to");
    router.push(`/admin/orders?${next.toString()}`);
  };

  const download = () => {
    setError(null);
    setMessage(null);
    startExport(async () => {
      const res = await adminExportOrdersCsvAction({
        from: start || undefined,
        to: end || undefined,
      });
      if (!res.ok) {
        setError(
          res.error === "forbidden"
            ? "権限がありません。"
            : res.error === "unauth"
              ? "ログインが切れています。再度ログインしてください。"
              : "書き出しに失敗しました。時間をおいて再度お試しください。",
        );
        return;
      }
      if (res.count === 0) {
        setError("この期間に該当する注文がありません。");
        return;
      }

      // Server Action は文字列しか返せないので、保存はここで行う。
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`${res.count} 件を書き出しました`);
      window.setTimeout(() => setMessage(null), 4000);
    });
  };

  const inputCls =
    "border border-indigo/25 bg-white px-3 py-2 text-[12.5px] text-indigo outline-none focus:border-gold";

  return (
    <div className="mb-6 border border-indigo/12 bg-paper/70 px-5 py-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="orders-from"
            className="text-[10px] tracking-[0.18em] text-indigo/55"
          >
            開始日
          </label>
          <input
            id="orders-from"
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
            className={inputCls}
          />
        </div>
        <span className="pb-2.5 text-indigo/40">〜</span>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="orders-to"
            className="text-[10px] tracking-[0.18em] text-indigo/55"
          >
            終了日
          </label>
          <input
            id="orders-to"
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            className={inputCls}
          />
        </div>

        <button
          type="button"
          onClick={() => apply(start, end)}
          className="border border-indigo bg-indigo px-5 py-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-paper-card transition-colors hover:bg-indigo-lift"
        >
          この期間で絞る
        </button>

        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setStart("");
              setEnd("");
              apply("", "");
            }}
            className="px-2 py-2.5 text-[10.5px] tracking-[0.18em] text-indigo/50 underline decoration-indigo/20 underline-offset-4 transition-colors hover:text-indigo"
          >
            期間を解除
          </button>
        )}

        <span className="ml-auto" />

        <button
          type="button"
          onClick={download}
          disabled={exporting}
          className="border border-indigo/30 bg-transparent px-5 py-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-indigo transition-colors hover:border-indigo disabled:cursor-wait disabled:opacity-50"
        >
          {exporting ? "書き出し中…" : "CSV でダウンロード"}
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-[1.7] text-indigo/55">
        日付は日本時間。終了日はその日いっぱいを含みます。CSV
        は画面と同じ条件で、1 注文 1 行で書き出します（一覧の表示上限
        200 件に対し、CSV は 5,000 件まで）。
      </p>

      {message && (
        <p className="mt-2 text-[12px] font-semibold text-moss">{message}</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[12px] font-semibold text-crimson">
          {error}
        </p>
      )}
    </div>
  );
}
