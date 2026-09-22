/**
 * @jest-environment node
 */

// レートリミッタ本体のテストは src/lib/__tests__/rate-limit.test.ts。
// ここで見るのは **配線** — どの Server Action が、どの用途のカウンタを、
// Better Auth を呼ぶ前に消費するか。Better Auth 側の rateLimit は
// `/api/auth/*` への HTTP リクエストにしか効かないので、この経路が抜けると
// パスワードの総当たりも認証メールの大量送信もそのまま通る。

const consumeRateLimit = jest.fn();
jest.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: (...a: unknown[]) => consumeRateLimit(...a),
  clientIpFrom: () => "203.0.113.5",
}));

const signInEmail = jest.fn();
const signUpEmail = jest.fn();
const sendVerificationEmail = jest.fn();
const requestPasswordReset = jest.fn();
const resetPassword = jest.fn();
const changePassword = jest.fn();
const changeEmail = jest.fn();
const getSession = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      signInEmail,
      signUpEmail,
      sendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      changePassword,
      changeEmail,
      getSession,
    },
  }),
}));

jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("@/db", () => ({ getDb: async () => ({}) }));
jest.mock("@/lib/trade", () => ({ createTradeApplication: jest.fn() }));
jest.mock("@/lib/emails/trade-emails", () => ({
  sendTradeApplicationNotification: jest.fn(),
  sendTradeApplicationAcknowledgement: jest.fn(),
}));

import {
  signInAction,
  registerPersonalAction,
  registerBusinessAction,
  resendVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  changeMyPasswordAction,
  changeMyEmailAction,
} from "@/lib/actions/auth";

const PERSONAL = {
  name: "佐藤 優子",
  email: "sato@example.com",
  password: "password1",
};
const BUSINESS = {
  contactName: "佐々木 優子",
  email: "trade@example.com",
  password: "password1",
  companyName: "鮨青山",
  businessType: "restaurant",
};

/** 各アクションを 1 回ずつ呼ぶ。期待する用途（bucket）とセットで並べる。 */
const CASES: Array<{ name: string; bucket: string; run: () => Promise<unknown> }> = [
  { name: "signInAction", bucket: "signIn", run: () => signInAction({ email: PERSONAL.email, password: PERSONAL.password }) },
  { name: "registerPersonalAction", bucket: "signUp", run: () => registerPersonalAction(PERSONAL) },
  { name: "registerBusinessAction", bucket: "signUp", run: () => registerBusinessAction(BUSINESS) },
  { name: "resendVerificationAction", bucket: "sendEmail", run: () => resendVerificationAction({ email: PERSONAL.email }) },
  { name: "requestPasswordResetAction", bucket: "sendEmail", run: () => requestPasswordResetAction({ email: PERSONAL.email }) },
  { name: "resetPasswordAction", bucket: "verify", run: () => resetPasswordAction({ token: "tok", password: "password1" }) },
  { name: "changeMyPasswordAction", bucket: "verify", run: () => changeMyPasswordAction({ currentPassword: "old-password", newPassword: "password1" }) },
  { name: "changeMyEmailAction", bucket: "sendEmail", run: () => changeMyEmailAction({ newEmail: "new@example.com" }) },
];

beforeEach(() => {
  jest.clearAllMocks();
  consumeRateLimit.mockResolvedValue({ ok: true });
  signUpEmail.mockResolvedValue({ user: { id: "u_1" } });
  getSession.mockResolvedValue({ user: { id: "u_1", email: PERSONAL.email } });
});

describe("認証系 Server Action のレート制限", () => {
  it.each(CASES)("$name は $bucket のカウンタを消費する", async ({ bucket, run }) => {
    await run();

    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit.mock.calls[0][0]).toEqual(
      expect.objectContaining({ bucket, ip: "203.0.113.5" }),
    );
  });

  it.each(CASES)("$name は上限超過で rate を返し、Better Auth を呼ばない", async ({ run }) => {
    consumeRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 120 });

    expect(await run()).toEqual({ ok: false, error: "rate" });

    // 止めたのに裏で呼んでいたら、総当たりも大量送信も素通りしている。
    for (const api of [
      signInEmail,
      signUpEmail,
      sendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      changePassword,
      changeEmail,
    ]) {
      expect(api).not.toHaveBeenCalled();
    }
  });

  it("入力が不正なら、カウンタを消費する前に弾く", async () => {
    // 形式エラーで枠を食わせられると、攻撃側は無害な入力で他人を締め出せる。
    expect(await signInAction({ email: "nope", password: "" })).toEqual({
      ok: false,
      error: "generic",
    });
    expect(await requestPasswordResetAction({ email: "nope" })).toEqual({
      ok: false,
      error: "invalid",
    });
    // メールアドレス変更も同じ。形式不正と「今と同じアドレス」は枠を使わない。
    expect(await changeMyEmailAction({ newEmail: "nope" })).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await changeMyEmailAction({ newEmail: PERSONAL.email })).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("メールアドレス変更の確認は、現在のアドレスに送る経路を通す", async () => {
    await changeMyEmailAction({ newEmail: "New@Example.com " });

    // 宛先を決めるのは src/lib/auth.ts の sendChangeEmailConfirmation。
    // ここで確かめるのは「Better Auth の changeEmail を、正規化した
    // アドレスと戻り先付きで呼んでいる」こと。
    expect(changeEmail).toHaveBeenCalledTimes(1);
    expect(changeEmail.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({
          newEmail: "new@example.com",
          callbackURL: "/account?email=changed",
        }),
      }),
    );
  });

  it("アカウントの有無は伏せたまま制限する（列挙対策を壊さない）", async () => {
    // 存在しないアドレスでも ok:true を返す仕様は維持する。
    requestPasswordReset.mockRejectedValue(new Error("no such user"));
    expect(await requestPasswordResetAction({ email: PERSONAL.email })).toEqual({
      ok: true,
    });
  });
});
