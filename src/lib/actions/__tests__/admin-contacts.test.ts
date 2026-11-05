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
let session: { user: { id: string; email: string } } | null = null;
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({ api: { getSession: async () => session } }),
}));
let isStaff = true;
jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => "owner",
  isStaffOrAbove: () => isStaff,
}));

const sendContactReply = jest.fn();
jest.mock("@/lib/emails/contact-emails", () => ({
  sendContactReply: (...a: unknown[]) => sendContactReply(...a),
}));
const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...a: unknown[]) => alertOps(...a),
}));

import {
  adminListContactsAction,
  adminReplyContactAction,
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

function repliesOf(contactId: string) {
  return sqlite
    .prepare(
      "SELECT body, sent_by_email AS sentBy FROM contact_reply WHERE contact_id = ? ORDER BY created_at",
    )
    .all(contactId) as Array<{ body: string; sentBy: string }>;
}

beforeEach(() => {
  jest.clearAllMocks();
  session = { user: { id: "admin_1", email: "owner@example.com" } };
  isStaff = true;
  sendContactReply.mockReset();
  sendContactReply.mockResolvedValue(undefined);
  sqlite = new DatabaseSync(":memory:");
  const dir = join(__dirname, "../../../../drizzle");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(join(dir, file), "utf8");
    if (!sql.includes("contact_message")) continue;
    for (const stmt of sql.split("--> statement-breakpoint")) {
      if (/contact_(message|reply)/.test(stmt)) sqlite.exec(stmt);
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

describe("adminListContactsAction の返信", () => {
  function reply(id: string, contactId: string, createdAt: number) {
    sqlite
      .prepare(
        "INSERT INTO contact_reply (id, contact_id, body, sent_by_email, created_at) VALUES (?, ?, ?, 'owner@example.com', ?)",
      )
      .run(id, contactId, `本文 ${id}`, createdAt);
  }

  it("返信を古い順にお問い合わせへ付ける", async () => {
    seed("c_1", "new", 1);
    seed("c_2", "new", 2);
    reply("r_2", "c_1", 20);
    reply("r_1", "c_1", 10);

    const res = await adminListContactsAction({ openOnly: true });

    if (!res.ok) throw new Error("読み込めなかった");
    const byId = new Map(res.messages.map((m) => [m.id, m.replies]));
    expect(byId.get("c_1")?.map((r) => r.id)).toEqual(["r_1", "r_2"]);
    expect(byId.get("c_2")).toEqual([]);
  });

  // 保有期間で消すときに返信だけが残ると、公開の約束を守れない。
  it("お問い合わせを消すと返信も消える", () => {
    seed("c_1", "done", 1);
    reply("r_1", "c_1", 10);

    sqlite.prepare("DELETE FROM contact_message WHERE id = 'c_1'").run();

    expect(repliesOf("c_1")).toEqual([]);
  });
});

describe("adminReplyContactAction", () => {
  // info@ からお客様へ届くので、管理者以外には絶対に送らせない。
  it("ログインしていなければ送らない", async () => {
    session = null;
    seed("c_1", "new", 1);

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "unauth" });
    expect(sendContactReply).not.toHaveBeenCalled();
  });

  it("管理者でなければ送らない", async () => {
    isStaff = false;
    seed("c_1", "new", 1);

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(sendContactReply).not.toHaveBeenCalled();
  });

  it("D1 の宛先へ送り、記録して、未対応を対応中にする", async () => {
    seed("c_1", "new", 1);

    expect(
      await adminReplyContactAction({
        id: "c_1",
        body: "  ご連絡ありがとうございます。  ",
        expectedReplies: 0,
      }),
    ).toEqual({ ok: true, recorded: true });

    expect(sendContactReply).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "sato@example.com",
        reply: "ご連絡ありがとうございます。",
      }),
    );
    expect(repliesOf("c_1")).toEqual([
      { body: "ご連絡ありがとうございます。", sentBy: "owner@example.com" },
    ]);
    expect(read("c_1")?.status).toBe("in_progress");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/contacts");
  });

  it("対応済みの状況と対応者は変えない", async () => {
    seed("c_1", "done", 1, "staff@example.com");

    await adminReplyContactAction({
      id: "c_1",
      body: "追加のご案内です。",
      expectedReplies: 0,
    });

    expect(read("c_1")).toEqual({
      status: "done",
      handledBy: "staff@example.com",
    });
  });

  it.each([
    ["空", ""],
    ["空白だけ", "  \n "],
    ["長すぎる", "あ".repeat(5001)],
  ])("本文が%sなら送らない", async (_label, body) => {
    seed("c_1", "new", 1);

    expect(
      await adminReplyContactAction({ id: "c_1", body, expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "invalid" });
    expect(sendContactReply).not.toHaveBeenCalled();
  });

  it("お問い合わせが消えていたら送らない", async () => {
    expect(
      await adminReplyContactAction({ id: "gone", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "gone" });
    expect(sendContactReply).not.toHaveBeenCalled();
  });

  it("送信に失敗したら記録せず、状況も変えない", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    sendContactReply.mockRejectedValue(new Error("resend down"));
    seed("c_1", "new", 1);

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "send" });
    errSpy.mockRestore();

    expect(repliesOf("c_1")).toEqual([]);
    expect(read("c_1")?.status).toBe("new");
  });

  // お客様には届いているので失敗とは返さない。失敗にすると同じ返信を送り直される。
  it("送れたのに記録できなかったら、そのことを返して人に知らせる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    seed("c_1", "new", 1);
    sqlite.exec(
      "CREATE TRIGGER no_reply BEFORE INSERT ON contact_reply BEGIN SELECT RAISE(ABORT, 'db down'); END",
    );

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: true, recorded: false });
    errSpy.mockRestore();

    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("c_1");
  });

  it("状況の更新だけ失敗しても、記録できたと返す", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    seed("c_1", "new", 1);
    sqlite.exec(
      "CREATE TRIGGER no_status BEFORE UPDATE ON contact_message BEGIN SELECT RAISE(ABORT, 'db down'); END",
    );

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: true, recorded: true });
    errSpy.mockRestore();

    expect(repliesOf("c_1")).toHaveLength(1);
    expect(alertOps).not.toHaveBeenCalled();
  });

  // 開いたままの画面から送ると、お客様に別々の返信が 2 通届く。
  it("読んだあとに返信されていたら送らず、一覧を読み直す", async () => {
    seed("c_1", "in_progress", 1);
    sqlite
      .prepare(
        "INSERT INTO contact_reply (id, contact_id, body, sent_by_email, created_at) VALUES ('r_1', 'c_1', '先の返信', 'staff@example.com', 1)",
      )
      .run();

    expect(
      await adminReplyContactAction({ id: "c_1", body: "本文", expectedReplies: 0 }),
    ).toEqual({ ok: false, error: "conflict" });

    expect(sendContactReply).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/contacts");
  });
});
