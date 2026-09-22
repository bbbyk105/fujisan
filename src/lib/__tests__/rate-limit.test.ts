/**
 * @jest-environment node
 */

// レート制限の肝は「同時に来ても数え落とさないこと」で、それを担保しているのは
// UPSERT 1 文（期限切れならリセット／生きていれば +1）そのもの。
// スタブで戻り値を作ると、その SQL を検証したことにならないので実 SQL を流す。

import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";

let sqlite: DatabaseSync;
let failNextQuery = false;

function makeDb() {
  return drizzle(async (sql, params, method) => {
    if (failNextQuery) throw new Error("d1 unavailable");
    const stmt = sqlite.prepare(sql);
    if (method === "run") {
      stmt.run(...(params as never[]));
      return { rows: [] };
    }
    const rows = stmt.all(...(params as never[])) as Record<string, unknown>[];
    const asArrays = rows.map((r) => Object.values(r));
    return { rows: method === "get" ? (asArrays[0] ?? []) : asArrays };
  });
}

jest.mock("@/db", () => ({ getDb: async () => makeDb() }));

import {
  clientIpFrom,
  consumeRateLimit,
  sweepRateLimitCounters,
  RATE_LIMITS,
} from "@/lib/rate-limit";

function rowCount(): number {
  const row = sqlite
    .prepare("SELECT COUNT(*) AS n FROM action_rate_limit")
    .get() as { n: number };
  return row.n;
}

beforeEach(() => {
  failNextQuery = false;
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE action_rate_limit (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER DEFAULT 0 NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE rate_limit (
      id TEXT PRIMARY KEY NOT NULL,
      key TEXT NOT NULL UNIQUE,
      count INTEGER NOT NULL,
      last_request INTEGER NOT NULL
    );
  `);
});

afterEach(() => {
  sqlite.close();
  jest.useRealTimers();
  // Math.random を差し替えたまま次のテストへ持ち越さない（掃除の間引きが狂う）
  jest.restoreAllMocks();
});

describe("consumeRateLimit", () => {
  it("上限までは通し、超えたところで止める", async () => {
    const opts = { bucket: "signIn" as const, ip: "203.0.113.5", max: 3 };

    expect(await consumeRateLimit(opts)).toEqual({ ok: true });
    expect(await consumeRateLimit(opts)).toEqual({ ok: true });
    expect(await consumeRateLimit(opts)).toEqual({ ok: true });

    const blocked = await consumeRateLimit(opts);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("IP ごとに別のカウンタを使う（他人の試行で巻き添えにしない）", async () => {
    const max = 2;
    await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5", max });
    await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5", max });
    expect(
      (await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5", max })).ok,
    ).toBe(false);

    expect(
      (await consumeRateLimit({ bucket: "signIn", ip: "198.51.100.9", max })).ok,
    ).toBe(true);
  });

  it("用途ごとに別のカウンタを使う（ログインの失敗で登録が止まらない）", async () => {
    const ip = "203.0.113.5";
    await consumeRateLimit({ bucket: "signIn", ip, max: 1 });
    expect((await consumeRateLimit({ bucket: "signIn", ip, max: 1 })).ok).toBe(
      false,
    );
    expect((await consumeRateLimit({ bucket: "signUp", ip, max: 1 })).ok).toBe(
      true,
    );
  });

  it("ウィンドウが切れたら 1 から数え直す", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-22T00:00:00Z"));
    const opts = { bucket: "signIn" as const, ip: "203.0.113.5", max: 2, windowMs: 60_000 };

    await consumeRateLimit(opts);
    await consumeRateLimit(opts);
    expect((await consumeRateLimit(opts)).ok).toBe(false);

    jest.setSystemTime(new Date("2026-09-22T00:01:01Z"));
    expect(await consumeRateLimit(opts)).toEqual({ ok: true });
    // 行は増やさず、同じ key を上書きして数え直す
    expect(rowCount()).toBe(1);
  });

  it("生 IP は保存しない（key はハッシュのみ）", async () => {
    await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5" });
    const row = sqlite
      .prepare("SELECT key FROM action_rate_limit")
      .get() as { key: string };

    expect(row.key).not.toContain("203.0.113.5");
    expect(row.key).toMatch(/^signIn:[0-9a-f]{16}$/);
  });

  it("DB が落ちていたら通す（レート制限で認証そのものを止めない）", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    failNextQuery = true;

    expect(await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5" })).toEqual(
      { ok: true },
    );
    errSpy.mockRestore();
  });

  it("同時に叩かれても数え落とさない（UPSERT 1 文の原子性）", async () => {
    // 「読んでから書く」実装だと、ここで全部が同じ count を読んで通ってしまう。
    const opts = { bucket: "signIn" as const, ip: "203.0.113.5", max: 3 };
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeRateLimit(opts)),
    );

    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(results.filter((r) => !r.ok)).toHaveLength(7);
  });

  it("既定値は用途ごとの設定を使う", async () => {
    const ip = "203.0.113.5";
    for (let i = 0; i < RATE_LIMITS.signUp.max; i += 1) {
      expect((await consumeRateLimit({ bucket: "signUp", ip })).ok).toBe(true);
    }
    expect((await consumeRateLimit({ bucket: "signUp", ip })).ok).toBe(false);
  });
});

describe("sweepRateLimitCounters", () => {
  // Better Auth は自分のカウンタを消さず、しかも key に**生の IP**が入る。
  // ここで消さないと IP が無期限に残り、プライバシーポリシーの
  //「1時間で削除します」が嘘になる。
  function seedAuthCounter(id: string, ip: string, lastRequest: number) {
    sqlite
      .prepare(
        "INSERT INTO rate_limit (id, key, count, last_request) VALUES (?, ?, 5, ?)",
      )
      .run(id, `${ip}|/sign-in/email`, lastRequest);
  }

  it("1時間より古い Better Auth のカウンタを消し、新しいものは残す", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-22T12:00:00Z"));
    const now = Date.now();
    seedAuthCounter("old", "203.0.113.5", now - 61 * 60 * 1000);
    seedAuthCounter("fresh", "198.51.100.9", now - 5 * 60 * 1000);
    // 期限切れの自前カウンタも一緒に消える
    sqlite
      .prepare(
        "INSERT INTO action_rate_limit (key, count, expires_at) VALUES ('signIn:deadbeefdeadbeef', 9, ?)",
      )
      .run(now - 1000);

    jest.spyOn(Math, "random").mockReturnValue(0); // 間引きを確実に通す
    await sweepRateLimitCounters();

    const keys = (
      sqlite.prepare("SELECT id FROM rate_limit").all() as { id: string }[]
    ).map((r) => r.id);
    expect(keys).toEqual(["fresh"]);
    expect(rowCount()).toBe(0);
  });

  it("生きているカウンタは消さない（掃除でリセットしてしまわない）", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-22T12:00:00Z"));
    await consumeRateLimit({ bucket: "signIn", ip: "203.0.113.5", max: 3 });

    jest.spyOn(Math, "random").mockReturnValue(0);
    await sweepRateLimitCounters();

    expect(rowCount()).toBe(1);
  });
});

describe("clientIpFrom", () => {
  it("CF-Connecting-IP を最優先で使う（XFF はクライアントが詐称できる）", () => {
    const h = new Headers({
      "cf-connecting-ip": "203.0.113.5",
      "x-forwarded-for": "1.2.3.4",
    });
    expect(clientIpFrom(h)).toBe("203.0.113.5");
  });

  it("XFF は先頭（最も手前のクライアント）を取る", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" });
    expect(clientIpFrom(h)).toBe("203.0.113.5");
  });

  it("何も無ければ unknown に落とす（全員で 1 つのカウンタを共有する）", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
