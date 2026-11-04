#!/usr/bin/env node
/**
 * 本番公開前の法令表示チェック（`npm run deploy` の predeploy で自動実行）。
 *
 * 特商法の表示や酒類販売管理者標識などの法令情報に、埋め忘れの伏せ字が残った
 * まま本番へ出さないよう、残っていればデプロイを止める。
 *
 * dev / build / CI は止めない（作業中は未確定でも動かせる必要がある）。
 * 検査対象は `src/data/` のみ — 法令情報の唯一の出どころだから。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = "src/data";

/** 埋め忘れを示すマーカー。1 つでも残っていればデプロイを止める。 */
const PLACEHOLDERS = [
  { pattern: /\[要確認\]/g, label: "[要確認]" },
  { pattern: /〇〇/g, label: "〇〇（伏せ字）" },
  { pattern: /\[TBD\]/gi, label: "[TBD]" },
  { pattern: /XXXX/g, label: "XXXX" },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/**
 * コメントを空白に置き換える（行番号と桁位置は保つ）。
 * 検査したいのは「公開される値」であって、ルールを説明する文章ではない。
 * これをやらないと、この規約を解説したコメント自体が引っかかる。
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, lead) =>
      lead + m.slice(lead.length).replace(/./g, " "),
    );
}

const problems = [];

// src/data/ に埋め忘れマーカーが残っていないか
for (const file of walk(DATA_DIR).filter((f) => /\.tsx?$/.test(f))) {
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const { pattern, label } of PLACEHOLDERS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        problems.push(`${file}:${i + 1}  ${label} が残っています → ${line.trim()}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error("\n✗ 法令表示が未完成のため、デプロイを中止しました。\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    [
      "",
      "伏せ字を正しい値に直してから、もう一度 `npm run deploy` してください。",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("✓ 法令表示チェック: 問題なし");
