/**
 * @jest-environment node
 */

// お問い合わせは「受領の正が D1」という設計。メールが落ちても失われないこと、
// bot とスパム連投を弾くこと、UI を迂回した不正入力を拒否することを検証する。

let requestHeaders = new Headers();
jest.mock("next/headers", () => ({
  headers: async () => requestHeaders,
}));

const inserted: Array<Record<string, unknown>> = [];
/** 連投チェックの select が返す「直近の送信」件数。 */
let recentCount = 0;
let insertShouldThrow = false;

jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () =>
            Array.from({ length: recentCount }, (_, i) => ({ id: `m_${i}` })),
        }),
      }),
    }),
    insert: () => ({
      values: async (row: Record<string, unknown>) => {
        if (insertShouldThrow) throw new Error("d1 unavailable");
        inserted.push(row);
      },
    }),
  }),
}));

const sendContactAdminNotification = jest.fn();
const sendContactAcknowledgement = jest.fn();
jest.mock("@/lib/emails/contact-emails", () => ({
  sendContactAdminNotification: (...a: unknown[]) =>
    sendContactAdminNotification(...a),
  sendContactAcknowledgement: (...a: unknown[]) =>
    sendContactAcknowledgement(...a),
}));

import { submitContactAction } from "@/lib/actions/contact";

const VALID = {
  name: "佐藤 優子",
  email: "sato@example.com",
  subject: "trade",
  message: "取扱いのご相談をさせてください。",
};

beforeEach(() => {
  jest.clearAllMocks();
  inserted.length = 0;
  recentCount = 0;
  insertShouldThrow = false;
  requestHeaders = new Headers({ "cf-connecting-ip": "203.0.113.1" });
});

describe("submitContactAction — 保存", () => {
  it("正常な入力を保存し、管理者通知と自動返信を送る", async () => {
    const res = await submitContactAction(VALID);

    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      name: "佐藤 優子",
      email: "sato@example.com",
      subject: "trade",
      message: "取扱いのご相談をさせてください。",
      status: "new",
      locale: "ja",
    });
    expect(sendContactAdminNotification).toHaveBeenCalledTimes(1);
    expect(sendContactAcknowledgement).toHaveBeenCalledTimes(1);
  });

  it("前後の空白を落として保存する", async () => {
    await submitContactAction({
      ...VALID,
      name: "  佐藤 優子  ",
      email: "  sato@example.com ",
      message: "  相談したい  ",
    });
    expect(inserted[0]).toMatchObject({
      name: "佐藤 優子",
      email: "sato@example.com",
      message: "相談したい",
    });
  });

  it("locale は ja / en のみ受け付け、未知の値は ja に寄せる", async () => {
    await submitContactAction({ ...VALID, locale: "en" });
    expect(inserted[0].locale).toBe("en");

    await submitContactAction({ ...VALID, locale: "fr" as never });
    expect(inserted[1].locale).toBe("ja");
  });

  it("生 IP は保存せず、ハッシュだけを持つ", async () => {
    await submitContactAction(VALID);
    const ipHash = inserted[0].ipHash as string;
    expect(ipHash).toHaveLength(16);
    expect(ipHash).not.toContain("203.0.113.1");
    expect(ipHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("IP が取れない環境でも保存できる（ipHash は null）", async () => {
    requestHeaders = new Headers();
    const res = await submitContactAction(VALID);
    expect(res).toEqual({ ok: true });
    expect(inserted[0].ipHash).toBeNull();
  });
});

describe("submitContactAction — 入力の検証", () => {
  it("必須項目が空なら invalid", async () => {
    for (const patch of [
      { name: "" },
      { email: "" },
      { message: "" },
      { subject: "" },
    ]) {
      expect(await submitContactAction({ ...VALID, ...patch })).toEqual({
        ok: false,
        error: "invalid",
      });
    }
    expect(inserted).toHaveLength(0);
  });

  it("メール形式が不正なら invalid", async () => {
    expect(await submitContactAction({ ...VALID, email: "nope" })).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("用件コードが既知のもの以外なら invalid（select の改ざん対策）", async () => {
    expect(
      await submitContactAction({ ...VALID, subject: "__evil__" }),
    ).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });
});

describe("submitContactAction — スパム対策", () => {
  it("ハニーポットに値が入っていたら、成功を装って静かに捨てる", async () => {
    const res = await submitContactAction({ ...VALID, website: "http://spam" });

    // bot に失敗を知らせない（知らせると入力を変えて再試行される）
    expect(res).toEqual({ ok: true });
    // ただし保存もメール送信もしない
    expect(inserted).toHaveLength(0);
    expect(sendContactAdminNotification).not.toHaveBeenCalled();
    expect(sendContactAcknowledgement).not.toHaveBeenCalled();
  });

  it("ハニーポットが空文字なら通常どおり受け付ける", async () => {
    const res = await submitContactAction({ ...VALID, website: "" });
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
  });

  it("同一 IP からの連投は rate で弾く", async () => {
    recentCount = 5;
    const res = await submitContactAction(VALID);
    expect(res).toEqual({ ok: false, error: "rate" });
    expect(inserted).toHaveLength(0);
    expect(sendContactAdminNotification).not.toHaveBeenCalled();
  });

  it("上限未満なら受け付ける", async () => {
    recentCount = 4;
    expect(await submitContactAction(VALID)).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
  });
});

describe("submitContactAction — 失敗時の扱い", () => {
  it("DB 保存に失敗したら db を返す（お客様に再送を促す）", async () => {
    insertShouldThrow = true;
    const res = await submitContactAction(VALID);
    expect(res).toEqual({ ok: false, error: "db" });
    expect(sendContactAdminNotification).not.toHaveBeenCalled();
  });

  it("メール送信が落ちても保存済みなら成功を返す", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    sendContactAdminNotification.mockRejectedValue(new Error("resend down"));
    sendContactAcknowledgement.mockRejectedValue(new Error("resend down"));

    const res = await submitContactAction(VALID);
    errSpy.mockRestore();

    // 受領の正は DB。メールが落ちても問い合わせは失われない。
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
  });

  it("管理者通知が落ちても自動返信は試みる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    sendContactAdminNotification.mockRejectedValue(new Error("resend down"));

    await submitContactAction(VALID);
    errSpy.mockRestore();

    expect(sendContactAcknowledgement).toHaveBeenCalledTimes(1);
  });
});
