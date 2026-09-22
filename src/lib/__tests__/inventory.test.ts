/**
 * @jest-environment node
 */

// 在庫の引き当ては「同時実行で売り越さないこと」が肝で、それを担保しているのは
// `UPDATE … WHERE on_hand - reserved >= qty` という SQL そのもの。
// スタブで戻り値を作ると、その SQL を検証したことにならない。
// そこで node:sqlite のインメモリ DB に drizzle が生成した実際の SQL を流す。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";

let sqlite: DatabaseSync;

/** drizzle を実 SQLite に繋ぐ。getDb() のモックから返す。 */
function makeDb() {
  return drizzle(async (sql, params, method) => {
    const stmt = sqlite.prepare(sql);
    if (method === "run") {
      stmt.run(...(params as never[]));
      return { rows: [] };
    }
    const rows = stmt.all(...(params as never[])) as Record<string, unknown>[];
    // sqlite-proxy は行を配列で受け取る
    const asArrays = rows.map((r) => Object.values(r));
    return { rows: method === "get" ? (asArrays[0] ?? []) : asArrays };
  });
}

jest.mock("@/db", () => ({
  getDb: async () => makeDb(),
}));

import {
  commitStock,
  readStock,
  readAllStock,
  releaseStock,
  reserveStock,
  restockCommitted,
} from "@/lib/inventory";

const line = (slug: string, ml: number, qty: number) => ({
  slug,
  name: "FUJISAN",
  variant: slug.toUpperCase(),
  ml,
  qty,
  unitPrice: 2750,
  lineTotal: 2750 * qty,
});

function seed(slug: string, ml: number, onHand: number, reserved = 0) {
  sqlite
    .prepare(
      "INSERT INTO inventory (product_slug, ml, on_hand, reserved, updated_at, created_at) VALUES (?, ?, ?, ?, 0, 0)",
    )
    .run(slug, ml, onHand, reserved);
}

/**
 * `drizzle/` のマイグレーションをそのまま流して同じ表を作る。
 *
 * 以前はここに CREATE TABLE を手書きしていたが、列を足したときに
 * **本番のスキーマとテストのスキーマが静かにずれた**（テストだけが古い表で
 * 通り続ける）。実ファイルを読めば、マイグレーションを足し忘れた時点で落ちる。
 */
function applyMigrations(): void {
  const dir = join(__dirname, "../../../drizzle");
  for (const file of ["0009_inventory.sql", "0012_product_price.sql"]) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      if (stmt.trim()) sqlite.exec(stmt);
    }
  }
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  applyMigrations();
  seed("shogun", 300, 3);
  seed("kokoro", 300, 1);
});

afterEach(() => sqlite.close());

describe("管理対象外の SKU", () => {
  it("在庫行が無ければ引き当てを素通りする（無制限に売れる）", async () => {
    // tenka は seed していない＝管理対象外
    expect(await reserveStock([line("tenka", 300, 99)])).toEqual({ ok: true });
  });

  it("readStock は管理対象外を null で返す", async () => {
    expect(await readStock("tenka", 300)).toBeNull();
    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 3,
      reserved: 0,
      available: 3,
    });
  });

  it("readAllStock は管理対象の SKU だけを返す", async () => {
    const all = await readAllStock();
    expect([...all.keys()].sort()).toEqual(["kokoro__300", "shogun__300"]);
  });
});

describe("引き当て", () => {
  it("在庫の範囲内なら reserved を積む", async () => {
    expect(await reserveStock([line("shogun", 300, 2)])).toEqual({ ok: true });
    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 3,
      reserved: 2,
      available: 1,
    });
  });

  it("ちょうど在庫ぴったりまで引き当てられる", async () => {
    expect(await reserveStock([line("shogun", 300, 3)])).toEqual({ ok: true });
    expect(await readStock("shogun", 300)).toMatchObject({ available: 0 });
  });

  it("販売可能数を超える要求は shortage で拒否する", async () => {
    await reserveStock([line("shogun", 300, 2)]); // 残り 1
    const res = await reserveStock([line("shogun", 300, 2)]);

    expect(res).toEqual({
      ok: false,
      reason: "shortage",
      shortages: [{ slug: "shogun", ml: 300, available: 1 }],
    });
    // 失敗した分は積まれていない
    expect(await readStock("shogun", 300)).toMatchObject({ reserved: 2 });
  });

  it("売り切れているとき available 0 を添えて返す", async () => {
    await reserveStock([line("kokoro", 300, 1)]);
    const res = await reserveStock([line("kokoro", 300, 1)]);
    expect(res).toMatchObject({
      reason: "shortage",
      shortages: [{ slug: "kokoro", ml: 300, available: 0 }],
    });
  });

  it("複数行で後ろが足りないとき、先に積んだ分を戻す（補償）", async () => {
    // shogun は足りる（3本中2本）、kokoro は足りない（1本しかないのに2本）
    const res = await reserveStock([
      line("shogun", 300, 2),
      line("kokoro", 300, 2),
    ]);

    expect(res.ok).toBe(false);
    // 補償されて shogun の引き当ては残っていない
    expect(await readStock("shogun", 300)).toMatchObject({
      reserved: 0,
      available: 3,
    });
    expect(await readStock("kokoro", 300)).toMatchObject({ reserved: 0 });
  });

  it("管理対象と対象外が混ざっていても、対象分だけ積む", async () => {
    expect(
      await reserveStock([line("tenka", 300, 5), line("shogun", 300, 1)]),
    ).toEqual({ ok: true });
    expect(await readStock("shogun", 300)).toMatchObject({ reserved: 1 });
  });

  it("空の明細は何もせず成功する", async () => {
    expect(await reserveStock([])).toEqual({ ok: true });
  });

  it("同じ最後の1本を2人が取り合っても、取れるのは1人だけ", async () => {
    seed("ninja", 300, 1);
    const [a, b] = await Promise.all([
      reserveStock([line("ninja", 300, 1)]),
      reserveStock([line("ninja", 300, 1)]),
    ]);

    // 片方だけが成功する（WHERE の在庫チェックが原子的に効く）
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(await readStock("ninja", 300)).toMatchObject({
      onHand: 1,
      reserved: 1,
      available: 0,
    });
  });
});

describe("確定", () => {
  it("引き当てた分を onHand から落とし reserved を戻す", async () => {
    const items = [line("shogun", 300, 2)];
    await reserveStock(items);
    await commitStock(items);

    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 1,
      reserved: 0,
      available: 1,
    });
  });

  it("引き当てより多く確定しても負にならない", async () => {
    await commitStock([line("shogun", 300, 99)]);
    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 0,
      reserved: 0,
    });
  });

  it("管理対象外の SKU を確定しても落ちない", async () => {
    await expect(commitStock([line("tenka", 300, 1)])).resolves.toBeUndefined();
  });
});

describe("解放", () => {
  it("引き当てを戻すと販売可能数が元に戻る", async () => {
    const items = [line("shogun", 300, 2)];
    await reserveStock(items);
    await releaseStock(items);

    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 3,
      reserved: 0,
      available: 3,
    });
  });

  it("引き当てていない分を解放しても負にならない", async () => {
    await releaseStock([line("shogun", 300, 5)]);
    expect(await readStock("shogun", 300)).toMatchObject({
      reserved: 0,
      onHand: 3,
    });
  });
});

describe("返金時の戻し", () => {
  it("確定済みの在庫を onHand に戻す", async () => {
    const items = [line("shogun", 300, 2)];
    await reserveStock(items);
    await commitStock(items); // onHand 1
    await restockCommitted(items);

    expect(await readStock("shogun", 300)).toMatchObject({
      onHand: 3,
      available: 3,
    });
  });
});
