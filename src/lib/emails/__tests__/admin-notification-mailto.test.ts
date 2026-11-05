/**
 * @jest-environment node
 */

// 管理者への通知メールのリンクも、宛先はお客様の入力。
// `?` や `&` で BCC を差し込めないこと（`&` は HTML のエスケープでは防げない）。

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));
jest.mock("@/lib/admin", () => ({
  getOwnerEmailsFromEnv: async () => ["owner@example.com"],
}));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { RESEND_API_KEY: "test", BETTER_AUTH_URL: "https://example.com" },
  }),
}));

import { sendContactAdminNotification } from "@/lib/emails/contact-emails";
import { sendTradeApplicationNotification } from "@/lib/emails/trade-emails";

const HOSTILE = "x@example.com?bcc=evil%40attacker.example&a=";

/** HTML の中の mailto リンクを、メールソフトが読むときの形に戻す。 */
function mailtoQueryKeys(): string[] {
  const html = sendEmail.mock.calls[0][0].html as string;
  const href = /href="(mailto:[^"]+)"/.exec(html)?.[1] ?? "";
  const url = new URL(href.replaceAll("&amp;", "&"));
  return [...url.searchParams.keys()];
}

beforeEach(() => jest.clearAllMocks());

describe("管理者への通知メールの mailto", () => {
  it("お問い合わせの通知に宛先以外を差し込ませない", async () => {
    await sendContactAdminNotification({
      name: "佐藤",
      email: HOSTILE,
      subject: "general",
      message: "本文",
      locale: "ja",
    } as Parameters<typeof sendContactAdminNotification>[0]);

    expect(mailtoQueryKeys()).toEqual([]);
  });

  it("取扱店の申請の通知に宛先以外を差し込ませない", async () => {
    await sendTradeApplicationNotification({
      companyName: "佐藤酒店",
      contactName: "佐藤",
      email: HOSTILE,
      phone: "0312345678",
      businessType: "restaurant",
      licenseNumber: null,
    } as unknown as Parameters<typeof sendTradeApplicationNotification>[0]);

    expect(mailtoQueryKeys()).toEqual([]);
  });
});
