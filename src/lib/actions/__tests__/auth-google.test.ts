/**
 * @jest-environment node
 */

// googleStartAction は公開の Server Action で、auth.api.* を直接呼ぶ経路には
// Better Auth の origin の確認が効かない。戻り先はここで絞る。

const signInSocial = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({ api: { signInSocial } }),
}));
jest.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: jest.fn(),
  clientIpFrom: () => "203.0.113.5",
}));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("@/db", () => ({ getDb: async () => ({}) }));
jest.mock("@/lib/trade", () => ({ createTradeApplication: jest.fn() }));
jest.mock("@/lib/emails/trade-emails", () => ({
  sendTradeApplicationNotification: jest.fn(),
  sendTradeApplicationAcknowledgement: jest.fn(),
}));

import { googleStartAction } from "@/lib/actions/auth";

beforeEach(() => {
  signInSocial.mockReset();
  signInSocial.mockResolvedValue({ url: "https://accounts.google.com/" });
});

const body = () => signInSocial.mock.calls[0][0].body;

describe("googleStartAction", () => {
  it("サイト内の戻り先はそのまま渡す", async () => {
    await googleStartAction(
      "/cart?resume=checkout",
      "/login/personal?error=google",
    );

    expect(body()).toMatchObject({
      provider: "google",
      callbackURL: "/cart?resume=checkout",
      errorCallbackURL: "/login/personal?error=google",
    });
  });

  it("外へ出る戻り先は渡さない", async () => {
    await googleStartAction("https://evil.example/", "//evil.example/");

    expect(body().callbackURL).toBe("/account");
    expect(body().errorCallbackURL).toBeUndefined();
  });
});
