/**
 * @jest-environment node
 */

// ゲスト購入と退会済みのお客様には、ログインできるアカウントが無い。
// 確定・発送のメールが /account へ案内すると、入れない先へ送ることになる。

const sendEmail = jest.fn();
jest.mock("@/lib/email", () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { BETTER_AUTH_URL: "https://sakefujisan.com" },
  }),
}));

import {
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
} from "@/lib/emails/order-emails";

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
};

const sent = () => sendEmail.mock.calls[0][0] as { text: string; html: string };

beforeEach(() => sendEmail.mockReset());

describe.each([
  ["注文確定", sendOrderConfirmedEmail],
  ["発送", sendOrderShippedEmail],
])("%sのメール", (_, send) => {
  it("会員には注文の確認ページを案内する", async () => {
    await send(ORDER);

    expect(sent().text).toContain("https://sakefujisan.com/account");
    expect(sent().html).toContain("https://sakefujisan.com/account");
  });

  it("アカウントが無いお客様にはお問い合わせを案内する", async () => {
    await send({ ...ORDER, noAccount: true });

    expect(sent().text).not.toContain("/account");
    expect(sent().html).not.toContain("/account");
    expect(sent().text).toContain("https://sakefujisan.com/contact");
    expect(sent().html).toContain("https://sakefujisan.com/contact");
  });
});
