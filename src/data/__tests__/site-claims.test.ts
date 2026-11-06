import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 行っていないサービスをサイトに書かない（2026-11-06 に本人が確認）。
 * 商品の梱包・配送・お取引の説明は事実だけを書く。文言を足すときに戻らないよう、
 * 画面に出るソースを走査して見張る。
 */
const UNAVAILABLE = [
  "化粧箱",
  "保冷",
  "18℃",
  "モールドファイバー",
  "クール便",
  "蔵見学",
  "専任",
  "月・火曜",
  "brewery visit",
  "chilled",
  "Cool-chain",
];

/** 過去のお問い合わせを表示するためにラベルだけ残している。 */
const ALLOWED = new Set(["src/data/fujisan-contact.ts"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("行っていないサービスの表示", () => {
  const files = ["src/app", "src/components", "src/data", "src/lib/emails"]
    .flatMap(sourceFiles)
    .filter((f) => !ALLOWED.has(f));

  it.each(UNAVAILABLE)("「%s」を書かない", (word) => {
    const found = files.filter((f) =>
      withoutComments(readFileSync(f, "utf8")).includes(word),
    );
    expect(found).toEqual([]);
  });
});
