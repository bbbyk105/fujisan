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

function applyFile(db: DatabaseSync, file: string): void {
  for (const stmt of readFileSync(join(DIR, file), "utf8").split(
    "--> statement-breakpoint",
  )) {
    if (stmt.trim()) db.exec(stmt);
  }
}

/** 名前順で `until` より前のマイグレーションだけを流す。 */
function applyBefore(db: DatabaseSync, until: string): void {
  for (const file of migrationFiles().filter((f) => f < until)) {
    applyFile(db, file);
  }
}

describe("0015 注文を退会後も残す", () => {
  const FILE = "0015_order_keep_after_account_delete.sql";

  /** 適用前の表に、お届け済みの注文を 1 件入れた DB を作る。 */
  function dbWithOrder(): DatabaseSync {
    const db = new DatabaseSync(":memory:");
    applyBefore(db, "0015");
    db.exec(`
      INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
        VALUES ('u_1', '山田 太郎', 'taro@example.com', 1, 0, 0);
      INSERT INTO orders (id, user_id, order_ref, status, items_json, items_count,
        subtotal, shipping, total, customer_name, customer_email, postal_code, address, phone,
        stripe_session_id, stripe_payment_intent_id, paid_at,
        stripe_refund_id, refunded_at, refunded_amount, receipt_addressee,
        cancel_requested_at, cancel_reason, tracking_carrier, tracking_number,
        shipped_at, delivered_at, created_at, updated_at)
      VALUES ('o_1', 'u_1', 'FJ-0001', 'delivered', '[{"slug":"shogun"}]', 1,
        2750, 1100, 3850, '山田 太郎', 'taro@example.com', '4170051', '静岡県富士市', '0545000000',
        'cs_1', 'pi_1', 1000,
        're_1', 2000, 1100, '上様',
        5000, '理由', 'ヤマト', 'TN1',
        6000, 7000, 3000, 4000);
    `);
    return db;
  }

  it("既存の注文を 1 列も変えずに移す", () => {
    const db = dbWithOrder();
    const before = db.prepare("SELECT * FROM orders").all() as Array<
      Record<string, unknown>
    >;
    // NULL の列があると、列の取り違えを見逃す
    expect(Object.values(before[0])).not.toContain(null);

    applyFile(db, FILE);
    expect(db.prepare("SELECT * FROM orders").all()).toEqual(before);
    db.close();
  });

  it("適用後は user を消しても注文が残り、user_id が NULL になる", () => {
    const db = dbWithOrder();
    applyFile(db, FILE);
    db.exec("DELETE FROM user WHERE id = 'u_1'");
    expect(db.prepare("SELECT user_id, total FROM orders").all()).toEqual([
      { user_id: null, total: 3850 },
    ]);
    db.close();
  });

  it("索引と一意制約が作り直されている", () => {
    const db = dbWithOrder();
    applyFile(db, FILE);
    const names = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='orders'")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "orders_order_ref_unique",
        "orders_user_id_idx",
        "orders_status_idx",
        "orders_created_at_idx",
      ]),
    );
    expect(() =>
      db.exec(`
        INSERT INTO orders (id, order_ref, items_json, items_count, subtotal, shipping, total,
          customer_name, customer_email, postal_code, address, phone)
        VALUES ('o_2', 'FJ-0001', '[]', 1, 0, 0, 0, '', '', '', '', '');
      `),
    ).toThrow(/UNIQUE/);
    db.close();
  });
});

describe("0016 注文に在庫の状態を持たせる", () => {
  const FILE = "0016_order_stock_state.sql";

  /** 適用前の表に注文を 1 件入れ、0016 を流して在庫の状態を返す。 */
  function stockStateAfterMigration(
    status: string,
    { paidAt = null, shippedAt = null }: {
      paidAt?: number | null;
      shippedAt?: number | null;
    } = {},
  ): string {
    const db = new DatabaseSync(":memory:");
    applyBefore(db, "0016");
    db.prepare(
      `INSERT INTO orders (id, order_ref, status, items_json, items_count, subtotal, shipping,
        total, customer_name, customer_email, postal_code, address, phone, paid_at, shipped_at,
        created_at, updated_at)
       VALUES ('o_1', 'FJ-0001', ?, '[]', 1, 2750, 1100, 3850, '山田 太郎', 'taro@example.com',
        '4170051', '静岡県富士市', '0545000000', ?, ?, 0, 0)`,
    ).run(status, paidAt, shippedAt);

    applyFile(db, FILE);

    const row = db.prepare("SELECT stock_state FROM orders").get() as {
      stock_state: string;
    };
    db.close();
    return row.stock_state;
  }

  it.each([
    ["confirmed", "committed"],
    ["preparing", "committed"],
    ["shipped", "shipped"],
    ["delivered", "shipped"],
  ])("%s の注文は %s になる", (status, expected) => {
    expect(stockStateAfterMigration(status, { paidAt: 1000 })).toBe(expected);
  });

  // 一度発送した注文は、手で戻してあっても蔵を出た扱いにする（`stockStateFor` と同じ）。
  it.each(["pending", "confirmed", "preparing"])(
    "発送後に %s へ戻した注文は蔵を出たままにする",
    (status) => {
      expect(
        stockStateAfterMigration(status, { paidAt: 1000, shippedAt: 2000 }),
      ).toBe("shipped");
    },
  );

  it("未入金の pending は引き当て中になる", () => {
    expect(stockStateAfterMigration("pending")).toBe("reserved");
  });

  it("手で pending へ戻した入金済みの注文は引き落とし済みになる", () => {
    expect(stockStateAfterMigration("pending", { paidAt: 1000 })).toBe(
      "committed",
    );
  });

  it.each(["cancelled", "refunded"])(
    "発送前に終わった %s の注文は在庫に何も残らない",
    (status) => {
      expect(stockStateAfterMigration(status, { paidAt: 1000 })).toBe("none");
    },
  );

  it.each(["cancelled", "refunded"])(
    "発送後に終わった %s の注文は蔵を出たままにする",
    (status) => {
      expect(
        stockStateAfterMigration(status, { paidAt: 1000, shippedAt: 2000 }),
      ).toBe("shipped");
    },
  );
});

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
