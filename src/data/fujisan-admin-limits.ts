/**
 * 管理画面の入力上限。
 *
 * 桁の打ち間違いを水際で止めるための値で、業務上の意味は無い。
 * `"use server"` のファイルは async 関数以外を export できないため、
 * Server Action と UI の両方から読めるようにここへ置く
 * （サーバー専用の依存を持たせないこと）。
 */

/** 価格の上限（円）。¥1,000,000 を超える 1 本は扱わない。 */
export const PRICE_MAX_JPY = 1_000_000;

/** 実在庫の上限（本）。 */
export const STOCK_MAX_QTY = 100_000;

/** 在庫僅少しきい値の上限（本）。 */
export const LOW_STOCK_MAX = 10_000;
