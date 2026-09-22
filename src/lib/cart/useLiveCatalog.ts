"use client";

import { useSyncExternalStore } from "react";
import { skuKey } from "@/data/fujisan-products";

/** 公開してよい実勢値だけ（卸価格は含めない）。 */
export type LiveSkuLite = {
  price: number;
  /** 買える本数。null は在庫管理の対象外＝数量制限をかけない。 */
  stock: number | null;
  soldOut: boolean;
  /** 在庫僅少。「残りわずか」の告知に使う。 */
  low: boolean;
};

export type LiveCatalog = Record<string, LiveSkuLite>;

/** SKU キー。サーバー側と同じ規則（`skuKey`）を使う。 */
export const liveKey = skuKey;

/**
 * `/api/catalog` の結果をモジュール単位でキャッシュする。
 *
 * 商品ページは静的配信なので、価格と在庫だけをハイドレーション後に取りに行く。
 * 複数のコンポーネントが同時にマウントされても fetch は 1 回に集約する
 * （一覧ページではカード 1 枚ずつが購読するため、集約しないと N 回走る）。
 */
let cache: LiveCatalog | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

function load(): void {
  if (cache || inflight) return;
  inflight = fetch("/api/catalog", { cache: "no-store" })
    .then((res): Promise<{ skus?: LiveCatalog } | null> =>
      res.ok
        ? (res.json() as Promise<{ skus?: LiveCatalog }>)
        : Promise.resolve(null),
    )
    .then((json) => {
      // 取得できなければ cache は null のまま＝コード側の価格で表示を続ける。
      if (!json?.skus) return;
      cache = json.skus;
      emit();
    })
    .catch(() => {
      // 通信失敗でも購入導線は止めない。価格と在庫の最終判断は
      // startCheckoutAction（サーバー）が必ず行う。
    })
    .finally(() => {
      inflight = null;
    });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  load();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): LiveCatalog | null {
  return cache;
}

/** SSR では常に null＝コードのカタログ値で描画し、ハイドレーション不整合を避ける。 */
function getServerSnapshot(): LiveCatalog | null {
  return null;
}

/**
 * 実勢の価格・在庫。`ready` が false のあいだはコード側のカタログ値を使う。
 * 最終的な価格と在庫の検証はサーバー（startCheckoutAction）が行う。
 */
export function useLiveCatalog(): { ready: boolean; catalog: LiveCatalog } {
  const catalog = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { ready: catalog !== null, catalog: catalog ?? {} };
}

/** 1 SKU 分の実勢値。取得前・管理対象外なら undefined。 */
export function useLiveSku(slug: string, ml: number): LiveSkuLite | undefined {
  const { catalog } = useLiveCatalog();
  return catalog[liveKey(slug, ml)];
}
