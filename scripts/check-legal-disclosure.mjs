#!/usr/bin/env node
/**
 * 本番公開前の法令表示チェック（`npm run deploy` の predeploy で自動実行）。
 *
 * 酒類の通信販売は、通信販売酒類小売業免許の番号・酒類販売管理者標識などの
 * 表示が法令上必須。ここが未確定のまま本番へ出ると法令違反になるため、
 * 埋まっていなければデプロイを止める。
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

// 1) src/data/ に埋め忘れマーカーが残っていないか
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

// 2) 通信販売酒類小売業免許の税務署名・番号が埋まっているか
//    （fujisan-legal.ts は import を持たない素の TS なので、値を正規表現で確認する）
const legalSrc = readFileSync(join(DATA_DIR, "fujisan-legal.ts"), "utf8");
const licenceBlock = legalSrc.match(
  /export const LIQUOR_LICENCE[\s\S]*?=\s*\{([\s\S]*?)\};/,
);
if (!licenceBlock) {
  problems.push(
    "src/data/fujisan-legal.ts: LIQUOR_LICENCE の定義が見つかりません（検査スクリプトの更新が必要）",
  );
} else {
  for (const field of ["taxOffice", "number"]) {
    const m = licenceBlock[1].match(new RegExp(`${field}\\s*:\\s*([^,\\n]+)`));
    const value = m?.[1]?.trim();
    if (!value || value === "null" || value === '""') {
      problems.push(
        `src/data/fujisan-legal.ts: 通信販売酒類小売業免許の ${field} が未設定です`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error("\n✗ 法令表示が未完成のため、デプロイを中止しました。\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    [
      "",
      "酒類の通信販売では、通信販売酒類小売業免許の番号の表示が必須です。",
      "税務署名と免許番号が判明したら src/data/fujisan-legal.ts の",
      "LIQUOR_LICENCE を埋めてから、もう一度 `npm run deploy` してください。",
      "",
      "（この検査を通さずに出す必要がある場合は、",
      "  `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy` を直接実行できますが、",
      "  法令違反のリスクを理解したうえで判断してください）",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("✓ 法令表示チェック: 問題なし");
