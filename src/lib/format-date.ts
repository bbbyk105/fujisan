/**
 * 日付の表示フォーマット。
 *
 * **必ず `timeZone: "Asia/Tokyo"` を指定すること。**
 * Cloudflare Workers のランタイムは UTC で動くため、タイムゾーンを省くと
 * 日本時間の 00:00〜09:00 に起きた出来事が 1 日前の日付で表示される
 * （領収書の発行日や注文日がずれると実害がある）。
 *
 * ローカル開発では OS のタイムゾーンが JST なら気づけないので、
 * 日付を出す箇所はここのヘルパーだけを使う。
 */

const JST = "Asia/Tokyo";

/** 例: 2026年9月20日 */
export const formatDateJp = (d: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

/** 例: 2026/9/20（一覧の詰まった表示向け） */
export const formatDateShortJp = (d: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);

/** 例: 2026/9/20 14:05 */
export const formatDateTimeJp = (d: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

/** 例: September 2026（英語ロケール表示用） */
export const formatMonthEn = (d: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: JST,
    year: "numeric",
    month: "long",
  }).format(d);

/** 例: 2026年9月（英語ロケールと対になる日本語表記） */
export const formatMonthJp = (d: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "long",
  }).format(d);
