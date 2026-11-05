/**
 * @jest-environment node
 */

// お問い合わせの一覧と対応状況の保存。
// 上書きを防いでいるのは WHERE 句なので、drizzle が作る実際の SQL を流して確かめる。

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";

let sqlite: DatabaseSync;

jest.mock("@/db", () => ({
  getDb: async () =>
    drizzle(async (sql, params, method) => {
      const stmt = sqlite.prepare(sql);
      if (method === "run") {
        stmt.run(...(params as never[]));
        return { rows: [] };
      }
      const rows = stmt.all(...(params as never[])) as Record<string, unknown>[];
      const asArrays = rows.map((r) => Object.values(r));
      return { rows: method === "get" ? (asArrays[0] ?? []) : asArrays };
    }),
}));

const revalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => revalidatePath(...a),
}));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => ({
        user: { id: "admin_1", email: "owner@example.com" },
      }),
    },
  }),
}));
jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => "owner",
  isStaffOrAbove: () => true,
}));

import {
  adminListContactsAction,
  adminSetContactStatusAction,
} from "@/lib/actions/admin-contacts";

function seed(
  id: string,
  status: string,
  createdAt: number,
  handledByEmail: string | null = null,
) {
  sqlite
    .prepare(
      "INSERT INTO contact_message (id, name, email, subject, message, status, handled_by_email, created_at) VALUES (?, '佐藤', 'sato@example.com', 'general', '本文', ?, ?, ?)",
    )
    .run(id, status, handledByEmail, createdAt);
}

function read(id: string) {
  return sqlite
    .prepare(
      "SELECT status, handled_by_email AS handledBy FROM contact_message WHERE id = ?",
    )
    .get(id) as { status: string; handledBy: string | null } | undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  sqlite = new DatabaseSync(":memory:");
  const dir = join(__dirname, "../../../../drizzle");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(join(dir, file), "utf8");
    if (!sql.includes("contact_message")) continue;
    for (const stmt of sql.split("--> statement-breakpoint")) {
      if (stmt.includes("contact_message")) sqlite.exec(stmt);
    }
  }
});

afterEach(() => sqlite.close());

describe("adminSetContactStatusAction", () => {
  it("読んだ状況のままなら更新し、対応した人を記録する", async () => {
    seed("c_1", "new", 1);

    expect(
      await adminSetContactStatusAction({
        id: "c_1",
        status: "done",
        expectedStatus: "new",
      }),
    ).toEqual({ ok: true });

    expect(read("c_1")).toEqual({
      status: "done",
      handledBy: "owner@example.com",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/contacts");
  });

  // 古い画面のまま保存すると、対応者の記録が消える。
  it("先に変えられていたら上書きせず、一覧を読み直して知らせる", async () => {
    seed("c_1", "done", 1, "staff@example.com");

    expect(
      await adminSetContactStatusAction({
        id: "c_1",
        status: "in_progress",
        expectedStatus: "new",
      }),
    ).toEqual({ ok: false, error: "conflict" });

    expect(read("c_1")).toEqual({
      status: "done",
      handledBy: "staff@example.com",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/contacts");
  });

  it("先に同じ状況へ変えられていても、対応者を書き換えない", async () => {
    seed("c_1", "done", 1, "staff@example.com");

    expect(
      await adminSetContactStatusAction({
        id: "c_1",
        status: "done",
        expectedStatus: "new",
      }),
    ).toEqual({ ok: false, error: "conflict" });

    expect(read("c_1")?.handledBy).toBe("staff@example.com");
  });

  // 保有期間を過ぎて消えた行を、古い画面から保存したとき。
  it("行が消えていたら、成功とは返さない", async () => {
    expect(
      await adminSetContactStatusAction({
        id: "gone",
        status: "done",
        expectedStatus: "new",
      }),
    ).toEqual({ ok: false, error: "conflict" });
  });
});

describe("adminListContactsAction", () => {
  it("件数は表示の上限に関わらず、全件から数える", async () => {
    seed("old_new", "new", 1);
    seed("old_progress", "in_progress", 2);
    for (let i = 0; i < 200; i++) seed(`done_${i}`, "done", 100 + i);

    const res = await adminListContactsAction({ openOnly: false });

    if (!res.ok) throw new Error("読み込めなかった");
    expect(res.messages).toHaveLength(200);
    expect(res.messages.some((m) => m.id === "old_new")).toBe(false);
    expect(res.counts).toEqual({ new: 1, inProgress: 1 });
  });
});
