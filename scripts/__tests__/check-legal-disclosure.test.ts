/**
 * @jest-environment node
 */

// `npm run deploy` の predeploy で動く検査。検査は src/data/ の下を読むので、
// 伏せ字の例を書いたこのテストは src/data/ に置かないこと（自分で引っかかる）。

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(__dirname, "../check-legal-disclosure.mjs");
const run = (cwd: string) =>
  spawnSync(process.execPath, [SCRIPT], { cwd, encoding: "utf8" });

/** 指定の内容を src/data に置いた作業フォルダで検査を流す。 */
function runWith(content: string) {
  const dir = mkdtempSync(join(tmpdir(), "check-legal-"));
  try {
    mkdirSync(join(dir, "src/data"), { recursive: true });
    writeFileSync(join(dir, "src/data/seller.ts"), content);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// 実物の src/data は読まない。読むと、作業中の伏せ字で npm test（＝ CI）まで
// 止まり、「dev / build / CI は止めない」が崩れる。
describe("デプロイ前の法令表示チェック", () => {
  it("伏せ字が無ければ止めない", () => {
    expect(runWith('export const seller = "株式会社 近藤薬局";\n').status).toBe(0);
  });

  it("埋め忘れの伏せ字が残っていれば止める", () => {
    const result = runWith('export const seller = "[要確認]";\n');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("[要確認]");
  });

  it("規約を説明するコメントの中の伏せ字では止めない", () => {
    expect(runWith('// [要確認] を残さないこと\nexport const a = 1;\n').status).toBe(0);
  });
});
