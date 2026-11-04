/**
 * @jest-environment node
 */

// 退会したお客様の注文も返金できる。そのメールが「ご注文履歴を見る」で
// /account へ案内すると、もうログインできない先へ送ることになる。

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { BETTER_AUTH_URL: "https://sakefujisan.com" },
  }),
}));

import { sendOrderRefundedEmail } from "@/lib/emails/order-emails";

const ORDER = {
  orderRef: "FJ-0001",
  customerName: "山田 太郎",
  customerEmail: "taro@example.com",
  items: [],
  itemsCount: 1,
  subtotal: 2750,
  shipping: 1100,
  total: 3850,
  postalCode: "4170051",
  address: "静岡県富士市吉原",
  refundAmount: 3850,
};

const sent = () => sendEmail.mock.calls[0][0] as { text: string; html: string };

beforeEach(() => sendEmail.mockReset());

describe("返金のお知らせ", () => {
  it("会員には注文履歴への案内を出す", async () => {
    await sendOrderRefundedEmail(ORDER);
    expect(sent().html).toContain("https://sakefujisan.com/account");
  });

  it("退会済みのお客様には、入れないアカウントのページへ案内しない", async () => {
    await sendOrderRefundedEmail({ ...ORDER, accountDeleted: true });
    expect(sent().text).not.toContain("/account");
    expect(sent().html).not.toContain("/account");
    expect(sent().html).not.toContain("ご注文履歴");
  });

  it("退会済みでも返金額は伝える", async () => {
    await sendOrderRefundedEmail({ ...ORDER, accountDeleted: true });
    expect(sent().html).toContain("3,850");
  });
});
