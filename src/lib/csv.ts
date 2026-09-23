/**
 * CSV の組み立て。
 *
 * 表計算ソフトへ渡す前提なので、素朴な join では足りない点が 2 つある。
 */

/**
 * 1 セルをエスケープする。
 *
 * **数式インジェクション対策**が肝。`=`・`+`・`-`・`@` などで始まる値を
 * そのまま書くと、Excel や Google スプレッドシートが**数式として実行する**。
 * 顧客が名前欄に `=HYPERLINK(...)` と入れた CSV を蔵の人が開くと、
 * その場で発火してしまう。先頭に `'` を足して、ただの文字列として扱わせる。
 */
function escapeCell(value: unknown): string {
  const raw =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);

  // 制御文字（タブ・改行・復帰）で始まるものも数式の起点になりうる。
  const neutralised = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  // ダブルクォートは 2 つ重ねて表す（RFC 4180）。
  return `"${neutralised.replace(/"/g, '""')}"`;
}

/**
 * 行の配列を CSV 文字列にする。
 *
 * **先頭に BOM を付ける。** 付けないと Excel（日本語環境）が UTF-8 と判断できず、
 * 日本語がすべて文字化けする。渡した先で開けない CSV は無いのと同じ。
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  // 改行は CRLF（RFC 4180）。Excel の互換性が高い。
  return `﻿${lines.join("\r\n")}\r\n`;
}
