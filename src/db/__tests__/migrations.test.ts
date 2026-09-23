/**
 * @jest-environment node
 */

// `drizzle/` の SQL は本番 D1 に適用される唯一の手順書で、
// `wrangler d1 migrations apply` は **journal ではなくファイル名順**に流す。
//
// 一方 `drizzle-kit generate` は journal の最後のスナップショットとの差分を出す。
// 両者がずれると「適用済みの列をもう一度 ADD する SQL」が生成される
// （実際に 0006 が手書きで足されて journal に載らず、その状態になっていた）。
//
// ここで守るのは 2 つ:
//   1. SQL を頭から流して破綻しないこと（新しい D1 を作れること）
//   2. journal が実ファイルと 1 対 1 で対応していること

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DIR = join(__dirname, "../../../drizzle");

/** `drizzle/` の .sql をファイル名順（= 適用順）に返す。 */
function migrationFiles(): string[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

describe("マイグレーション", () => {
  it("頭から流して新しい DB を作れる", () => {
    const db = new DatabaseSync(":memory:");
    try {
      for (const file of migrationFiles()) {
        const sql = readFileSync(join(DIR, file), "utf8");
        for (const stmt of sql.split("--> statement-breakpoint")) {
          if (stmt.trim()) {
            try {
              db.exec(stmt);
            } catch (err) {
              throw new Error(`${file} の適用に失敗: ${String(err)}`);
            }
          }
        }
      }
    } finally {
      db.close();
    }
  });

  it("流し終えた DB に、コードが参照する表がそろっている", () => {
    const db = new DatabaseSync(":memory:");
    for (const file of migrationFiles()) {
      const sql = readFileSync(join(DIR, file), "utf8");
      for (const stmt of sql.split("--> statement-breakpoint")) {
        if (stmt.trim()) db.exec(stmt);
      }
    }

    const names = new Set(
      (
        db
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all() as Array<{ name: string }>
      ).map((r) => r.name),
    );
    db.close();

    for (const table of [
      "user",
      "session",
      "account",
      "orders",
      "team_invite",
      "contact_message",
      "inventory",
      "product_price",
      "trade_account",
      "rate_limit",
      "action_rate_limit",
    ]) {
      expect(names.has(table)).toBe(true);
    }

    // 0012 で落としたはずの旧表が残っていないこと。
    expect(names.has("product_sku")).toBe(false);
  });

  it("journal が実ファイルと 1 対 1 で対応している", () => {
    // ここがずれていると drizzle-kit generate が
    // 「適用済みの列をもう一度 ADD する SQL」を吐く。
    const journal = JSON.parse(
      readFileSync(join(DIR, "meta/_journal.json"), "utf8"),
    ) as { entries: Array<{ idx: number; tag: string }> };

    const tags = journal.entries.map((e) => e.tag);
    const files = migrationFiles().map((f) => f.replace(/\.sql$/, ""));

    expect(tags).toEqual(files);
    // idx は 0 から連番。次に生成されるファイルの番号がここで決まる。
    expect(journal.entries.map((e) => e.idx)).toEqual(files.map((_, i) => i));
  });

  it("最後の entry に対応するスナップショットが存在する", () => {
    // drizzle-kit generate はこれを読んで差分を出す。無いと 0 から作り直す。
    const journal = JSON.parse(
      readFileSync(join(DIR, "meta/_journal.json"), "utf8"),
    ) as { entries: Array<{ idx: number }> };
    const last = journal.entries[journal.entries.length - 1];
    const snapshot = String(last.idx).padStart(4, "0") + "_snapshot.json";

    expect(readdirSync(join(DIR, "meta"))).toContain(snapshot);
  });
});
