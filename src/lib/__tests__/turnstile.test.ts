/**
 * @jest-environment node
 */

// ゲストの決済開始の入口。ボットを止めつつ、Cloudflare の不調では販売を止めない。

const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...a: unknown[]) => alertOps(...a),
}));

import { verifyTurnstile } from "@/lib/turnstile";

const fetchMock = jest.fn();

const respond = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// 通知の間引きがテストをまたがないよう、テストごとに時計を十分に進める。
let now = 0;

beforeEach(() => {
  now += 24 * 60 * 60 * 1000;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  alertOps.mockReset();
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const verify = (token?: string) =>
  verifyTurnstile({ secret: "secret", token, ip: "203.0.113.1" });

describe("verifyTurnstile", () => {
  it("成功なら通す", async () => {
    fetchMock.mockResolvedValue(respond({ success: true }));

    await expect(verify("token")).resolves.toBe(true);
  });

  it("秘密鍵・トークン・IP を Cloudflare へ送る", async () => {
    fetchMock.mockResolvedValue(respond({ success: true }));

    await verify("token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(JSON.parse(init.body)).toEqual({
      secret: "secret",
      response: "token",
      remoteip: "203.0.113.1",
    });
  });

  it("失敗なら止める", async () => {
    fetchMock.mockResolvedValue(
      respond({ success: false, "error-codes": ["invalid-input-response"] }),
    );

    await expect(verify("token")).resolves.toBe(false);
  });

  it("トークンが無ければ、問い合わせずに止める", async () => {
    await expect(verify(undefined)).resolves.toBe(false);
    await expect(verify("")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Server Action は直接呼べるので、型どおりの値が来るとは限らない。例外になると
  // 「不調では通す」の分岐に落ちて、判定を素通りできてしまう。
  it("文字列でないトークンは、問い合わせずに止める", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await expect(verify(BigInt(1) as never)).resolves.toBe(false);
    await expect(verify(circular as never)).resolves.toBe(false);
    await expect(verify({ a: 1 } as never)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("長すぎるトークンは、問い合わせずに止める", async () => {
    await expect(verify("x".repeat(2049))).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 偽のトークンを連投して 429 を起こせるなら、通すと判定を素通りできる。
  it("429 は止める", async () => {
    fetchMock.mockResolvedValue(respond({}, 429));

    await expect(verify("token")).resolves.toBe(false);
  });

  it("4xx は不調ではないので止める", async () => {
    fetchMock.mockResolvedValue(respond({}, 400));

    await expect(verify("token")).resolves.toBe(false);
  });

  it("IP が分からなければ remoteip を送らない", async () => {
    fetchMock.mockResolvedValue(respond({ success: true }));

    await verifyTurnstile({ secret: "secret", token: "token", ip: "unknown" });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      secret: "secret",
      response: "token",
    });
  });

  it("応答が無ければ待ち続けないよう、時間を切る", async () => {
    fetchMock.mockResolvedValue(respond({ success: true }));

    await verify("token");

    expect(fetchMock.mock.calls[0][1].signal).toBeDefined();
  });

  // Cloudflare の不調で販売を止めない（回数制限は別に効いている）。
  describe("Cloudflare の不調では通す", () => {
    let errSpy: jest.SpyInstance;
    beforeEach(() => {
      errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => errSpy.mockRestore());

    it("接続できないとき", async () => {
      fetchMock.mockRejectedValue(new Error("network"));

      await expect(verify("token")).resolves.toBe(true);
    });

    it.each([500, 503])("ステータス %i のとき", async (status) => {
      fetchMock.mockResolvedValue(respond({}, status));

      await expect(verify("token")).resolves.toBe(true);
    });

    // 判定が効いていないので、人が気づけるようにする。
    it("通したことを運用へ知らせる", async () => {
      fetchMock.mockResolvedValue(respond({}, 503));

      await verify("token");

      expect(alertOps).toHaveBeenCalledTimes(1);
    });

    // 不調のあいだ決済のたびに送ると、メールの枠を使い切って注文確定のメールまで止まる。
    it("続けて起きても、通知は間引く", async () => {
      fetchMock.mockResolvedValue(respond({}, 503));

      await verify("token");
      await verify("token");
      await verify("token");

      expect(alertOps).toHaveBeenCalledTimes(1);
    });

    it("200 でも本文が読めなければ、不調として通す", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("not json");
        },
      });

      await expect(verify("token")).resolves.toBe(true);
    });

    it("Cloudflare 内部のエラーを返したとき", async () => {
      fetchMock.mockResolvedValue(
        respond({ success: false, "error-codes": ["internal-error"] }),
      );

      await expect(verify("token")).resolves.toBe(true);
    });
  });

  it("4xx でも秘密鍵の誤りなら通して、運用へ知らせる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(
      respond({ success: false, "error-codes": ["invalid-input-secret"] }, 401),
    );

    await expect(verify("token")).resolves.toBe(true);
    errSpy.mockRestore();

    expect(alertOps).toHaveBeenCalledTimes(1);
  });

  it("4xx で本文が読めなくても止める", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(verify("token")).resolves.toBe(false);
    expect(alertOps).not.toHaveBeenCalled();
  });

  // 秘密鍵の貼り間違いなど。止めるとゲスト全員が買えなくなる。
  it.each(["invalid-input-secret", "missing-input-secret"])(
    "秘密鍵の誤り（%s）は通して、運用へ知らせる",
    async (code) => {
      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      fetchMock.mockResolvedValue(
        respond({ success: false, "error-codes": [code] }),
      );

      await expect(verify("token")).resolves.toBe(true);
      errSpy.mockRestore();

      expect(alertOps).toHaveBeenCalledTimes(1);
    },
  );
});
