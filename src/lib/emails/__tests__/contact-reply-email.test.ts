/**
 * @jest-environment node
 */

// 管理画面からお客様へ送る返信。お客様が入れた名前や本文を HTML に出すので、
// エスケープを落とすと、受け取った本人のメールに任意の HTML を差し込める。

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));
jest.mock("@/lib/admin", () => ({ getOwnerEmailsFromEnv: async () => [] }));
let env: Record<string, string> = {};
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env }),
}));

import { sendContactReply } from "@/lib/emails/contact-emails";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";

const BASE = {
  name: "佐藤 優子",
  email: "sato@example.com",
  subject: "trade" as const,
  message: "取扱いについて教えてください。",
  locale: "ja" as const,
  reply: "ご連絡ありがとうございます。\n価格表をお送りします。",
};

function sent() {
  return sendEmail.mock.calls[0][0] as {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo: string;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  env = { RESEND_API_KEY: "test", RESEND_FROM: "FUJISAN <info@example.com>" };
  sendEmail.mockResolvedValue(undefined);
});

describe("sendContactReply", () => {
  it("お客様の返信が info@ へ届くように送る", async () => {
    await sendContactReply(BASE);

    expect(sent().to).toBe("sato@example.com");
    expect(sent().replyTo).toBe(FUJISAN_LEGAL.email);
    expect(sendEmail.mock.calls[0][1]).toEqual({
      apiKey: "test",
      from: "FUJISAN <info@example.com>",
    });
  });

  it("宛名、本文、いただいた内容、販売者の表記を入れる", async () => {
    await sendContactReply(BASE);
    const { subject, text } = sent();

    expect(subject).toBe("Re: 卸・取扱店 — FUJISAN SAKE");
    expect(text.startsWith("佐藤 優子 様\n")).toBe(true);
    expect(text).toContain(BASE.reply);
    expect(text).toContain("── いただいた内容 ──\n取扱いについて教えてください。");
    expect(text).toContain(FUJISAN_LEGAL.sellerName);
    expect(text).toContain(FUJISAN_LEGAL.email);
  });

  it("英語のページからのお問い合わせには英語で組む", async () => {
    await sendContactReply({ ...BASE, name: "Jane Miller", locale: "en" });
    const { subject, text } = sent();

    expect(subject).toBe("Re: Trade & Wholesale — FUJISAN SAKE");
    expect(text.startsWith("Dear Jane Miller,\n")).toBe(true);
    expect(text).toContain("── Your message ──");
  });

  it("名前、本文、いただいた内容を HTML へそのまま出さない", async () => {
    await sendContactReply({
      ...BASE,
      name: "<b>name</b>",
      message: "<img src=x onerror=alert(1)>",
      reply: "<script>alert(1)</script>",
    });
    const { html } = sent();

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>name");
    expect(html).toContain("&lt;script&gt;");
  });

  // CSS の pre-wrap は Outlook などで効かないことがある。
  it("本文の改行を HTML でも残す", async () => {
    await sendContactReply(BASE);

    expect(sent().html).toContain("ご連絡ありがとうございます。<br />価格表");
  });

  // 色は 6 桁の hex で書く。#RRGGBBAA は Outlook などで捨てられる。
  it("色に不透明度付きの hex を使わない", async () => {
    await sendContactReply(BASE);

    expect(sent().html).not.toMatch(/#[0-9a-fA-F]{8}\b/);
  });

  // sendEmail はキーが無いとコンソールへ出して正常に終わる。
  it("API キーが無ければ、送れたことにしない", async () => {
    env = {};

    await expect(sendContactReply(BASE)).rejects.toThrow("RESEND_API_KEY");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  // 届いていないのに「送信しました」と出してはいけない。
  it("送信の失敗はそのまま返す", async () => {
    sendEmail.mockRejectedValue(new Error("Resend send failed: 500"));

    await expect(sendContactReply(BASE)).rejects.toThrow("Resend send failed");
  });
});
