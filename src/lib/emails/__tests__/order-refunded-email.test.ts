/**
 * @jest-environment node
 */

// アカウントが無いお客様（退会済み・ゲスト購入）の注文も返金できる。そのメールが
// 「ご注文履歴を見る」で /account へ案内すると、入れない先へ送ることになる。

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

  it("アカウントが無いお客様には、入れないアカウントのページへ案内しない", async () => {
    await sendOrderRefundedEmail({ ...ORDER, noAccount: true });
    expect(sent().text).not.toContain("/account");
    expect(sent().html).not.toContain("/account");
    expect(sent().html).not.toContain("ご注文履歴");
  });

  it("アカウントが無くても返金額は伝える", async () => {
    await sendOrderRefundedEmail({ ...ORDER, noAccount: true });
    expect(sent().html).toContain("3,850");
  });
});

// 一部返金は発送の前にも後にも起きる。品物が蔵を出たあとの注文に
// 「このまま発送いたします」と書くと、もう一度届くと読めてしまう。
describe("一部返金のお知らせ", () => {
  const PARTIAL = { ...ORDER, partial: true, refundAmount: 1100 };

  it("発送前なら、このまま発送することを伝える", async () => {
    await sendOrderRefundedEmail({ ...PARTIAL, stillShipping: true });
    expect(sent().text).toContain("このまま発送いたします");
    expect(sent().html).toContain("このまま発送いたします");
    expect(sent().html).toContain("will still be shipped");
  });

  it("発送後なら、発送の案内を出さない", async () => {
    await sendOrderRefundedEmail({ ...PARTIAL, stillShipping: false });
    for (const body of [sent().text, sent().html]) {
      expect(body).not.toContain("発送いたします");
      expect(body).not.toContain("will still be shipped");
    }
  });

  it("発送後でも、一部の返金であることは伝える", async () => {
    await sendOrderRefundedEmail({ ...PARTIAL, stillShipping: false });
    expect(sent().text).toContain("このご返金は一部のみです");
    expect(sent().html).toContain("1,100");
  });

  // 渡し忘れたときに「発送します」と書くと、同じ不具合が戻る。
  it("指定が無ければ、発送の案内を出さない", async () => {
    await sendOrderRefundedEmail(PARTIAL);
    expect(sent().text).not.toContain("発送いたします");
  });

  it("全額返金には発送の案内を出さない", async () => {
    await sendOrderRefundedEmail({ ...ORDER, stillShipping: true });
    expect(sent().text).not.toContain("発送いたします");
  });
});
