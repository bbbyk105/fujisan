/**
 * @jest-environment node
 */

import { toCsv } from "@/lib/csv";

/** BOM を外して行に割る（検証しやすくするため）。 */
function lines(csv: string): string[] {
  expect(csv.startsWith("﻿")).toBe(true);
  return csv.slice(1).trimEnd().split("\r\n");
}

describe("CSV の組み立て", () => {
  it("見出しと値をクォートして並べる", () => {
    const csv = toCsv(["注文番号", "金額"], [["FJ-1", 2750]]);
    expect(lines(csv)).toEqual(['"注文番号","金額"', '"FJ-1","2750"']);
  });

  it("Excel が UTF-8 と判定できるよう BOM を付ける", () => {
    // 付けないと日本語が丸ごと文字化けして、渡した先で開けない。
    expect(toCsv(["銘柄"], [["将軍"]]).startsWith("﻿")).toBe(true);
  });

  it("ダブルクォートは 2 つ重ねる", () => {
    expect(lines(toCsv(["x"], [['言わ"ば']]))[1]).toBe('"言わ""ば"');
  });

  it("カンマや改行を含んでも行が壊れない", () => {
    const csv = toCsv(["住所"], [["静岡県, 富士宮市\n1-2-3"]]);
    // クォートで囲まれているので、行数は見出し+1 のまま。
    expect(csv.slice(1).trimEnd().split(/\r\n(?=")/)).toHaveLength(2);
  });

  it("数式として実行されうる値を無害化する", () => {
    // 表計算ソフトは =・+・-・@ で始まるセルを数式と見なす。顧客が名前欄に
    // 入れた文字列が、蔵の人が開いた瞬間に発火するのを防ぐ。
    const csv = toCsv(
      ["名前"],
      [["=HYPERLINK(\"http://evil\",\"click\")"], ["+1"], ["-1"], ["@x"]],
    );
    const body = lines(csv).slice(1);
    for (const cell of body) expect(cell.startsWith('"\'')).toBe(true);
  });

  it("普通の負の数も無害化される（値は失わない）", () => {
    // 「-1000」は返金額として現れる。先頭に ' が付くが、数値そのものは残る。
    const [, cell] = lines(toCsv(["返金"], [[-1000]]));
    expect(cell).toBe(`"'-1000"`);
  });

  it("null と undefined は空欄にする", () => {
    expect(lines(toCsv(["a", "b"], [[null, undefined]]))[1]).toBe('"",""');
  });
});
