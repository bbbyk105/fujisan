/**
 * @jest-environment node
 */

// buildAuthOptions は Better Auth に渡す設定そのもの。ここが静かに変わると、
// レート制限が無効になったり、アカウント乗っ取りの経路が開いたりする。
// 設定の**意図**を落とさないための防波堤として、要点だけを固定する。

// better-auth は ESM のみで配布されており、jest から素直に読めない。
// ここで見たいのは**渡す設定**だけなので、ライブラリ本体は差し替える。
jest.mock("better-auth", () => ({ betterAuth: jest.fn() }));
jest.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: jest.fn(),
}));

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));

import { buildAuthOptions } from "@/lib/auth";

const ENV = {
  BETTER_AUTH_SECRET: "s3cret",
  BETTER_AUTH_URL: "https://example.test",
  RESEND_API_KEY: "re_test",
  RESEND_FROM: "FUJISAN <noreply@example.test>",
};

beforeEach(() => jest.clearAllMocks());

describe("メールアドレスの変更", () => {
  it("有効化されている（無効だと Better Auth が 400 を返すだけ）", () => {
    const options = buildAuthOptions(ENV);
    expect(options.user.changeEmail.enabled).toBe(true);
  });

  it("確認メールは **変更前** のアドレスへ送る", async () => {
    // ここが newEmail になっていると、セッションを奪った側が現アドレスの
    // 持ち主に知らせないままアカウントを移し替えられる。
    const options = buildAuthOptions(ENV);
    await options.user.changeEmail.sendChangeEmailConfirmation({
      user: { email: "old@example.test", name: "佐藤 優子" },
      newEmail: "new@example.test",
      url: "https://example.test/api/auth/verify-email?token=t",
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [payload] = sendEmail.mock.calls[0];
    expect(payload.to).toBe("old@example.test");
  });

  it("本文に新旧のアドレスと、心当たりが無い場合の案内を載せる", async () => {
    const options = buildAuthOptions(ENV);
    await options.user.changeEmail.sendChangeEmailConfirmation({
      user: { email: "old@example.test" },
      newEmail: "new@example.test",
      url: "https://example.test/api/auth/verify-email?token=t",
    });

    const [payload] = sendEmail.mock.calls[0];
    expect(payload.text).toContain("old@example.test");
    expect(payload.text).toContain("new@example.test");
    // 「開かないでください」の案内が無いと、心当たりの無い人が反射的に踏む。
    expect(payload.text).toContain("開かないでください");
  });
});

describe("レート制限", () => {
  it("D1 に置く（既定の memory は Workers で機能しない）", () => {
    const options = buildAuthOptions(ENV);
    expect(options.rateLimit.storage).toBe("database");
  });

  it("環境に関係なく有効にする（黙って無効がいちばん困る）", () => {
    expect(buildAuthOptions(ENV).rateLimit.enabled).toBe(true);
  });

  it("CF-Connecting-IP を先に見る（IP が取れないと制限ごと諦められる）", () => {
    const headers = buildAuthOptions(ENV).advanced.ipAddress.ipAddressHeaders;
    expect(headers[0]).toBe("cf-connecting-ip");
    // X-Forwarded-For はクライアントが詐称できるので後ろ。
    expect(headers.indexOf("x-forwarded-for")).toBeGreaterThan(0);
  });
});

describe("Google ログイン", () => {
  it("client id と secret が両方そろったときだけ有効にする", () => {
    expect(buildAuthOptions(ENV)).not.toHaveProperty("socialProviders");
    expect(
      buildAuthOptions({ ...ENV, GOOGLE_CLIENT_ID: "id" }),
    ).not.toHaveProperty("socialProviders");
    expect(
      buildAuthOptions({
        ...ENV,
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret",
      }),
    ).toHaveProperty("socialProviders.google");
  });
});
