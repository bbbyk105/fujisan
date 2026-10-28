/**
 * @jest-environment jsdom
 */

// 領収書は、登録番号を入れるだけで適格簡易請求書として渡すことになる。
// 番号の行が出ないまま、あるいは「インボイスが必要なら問い合わせを」の一文が
// 残ったままだと、受け取った側は仕入税額控除に使えるのか判断できない。

import { render } from "@testing-library/react";
import type { OrderRecord } from "@/lib/actions/orders";

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: () => {
    throw new Error("redirect");
  },
}));
jest.mock("@/lib/session", () => ({
  getSession: async () => ({ user: { id: "u_1" } }),
}));
const getMyOrderByRefAction = jest.fn();
jest.mock("@/lib/actions/orders", () => ({
  getMyOrderByRefAction: (...a: unknown[]) => getMyOrderByRefAction(...a),
}));
// 印刷ボタンと宛名の入力欄はクライアントの部品で、ここでは見ない。
jest.mock("@/components/fujisan/auth/PrintButton", () => ({
  PrintButton: () => null,
}));
jest.mock("@/components/fujisan/auth/ReceiptAddresseeForm", () => ({
  ReceiptAddresseeForm: () => null,
}));

import ReceiptPage from "@/app/account/orders/[orderRef]/receipt/page";

const ORDER = {
  orderRef: "FJ-0001",
  status: "delivered",
  items: [
    {
      slug: "shogun",
      ml: 300,
      name: "将軍",
      variant: "純米大吟醸",
      unitPrice: 2750,
      qty: 1,
      lineTotal: 2750,
    },
  ],
  itemsCount: 1,
  shipping: 1100,
  total: 3850,
  customerName: "山田 太郎",
  receiptAddressee: null,
  refundedAmount: null,
  paidAt: new Date("2026-10-01T03:00:00Z"),
  createdAt: new Date("2026-10-01T02:55:00Z"),
} as unknown as OrderRecord;

async function renderReceipt() {
  getMyOrderByRefAction.mockResolvedValue(ORDER);
  const page = await ReceiptPage({ params: Promise.resolve({ orderRef: "FJ-0001" }) });
  return render(page).container.textContent ?? "";
}

describe("領収書の適格請求書の表示", () => {
  it("発行者の欄に登録番号を出す", async () => {
    const text = await renderReceipt();
    expect(text).toContain("株式会社 近藤薬局");
    expect(text).toContain("登録番号：T4080103000596");
  });

  it("登録済みなので「インボイスが必要なら問い合わせを」の一文は出さない", async () => {
    const text = await renderReceipt();
    expect(text).not.toContain("適格請求書（インボイス）としてのご利用をご希望の場合");
  });

  it("税率を合計の欄に出す（適格簡易請求書の記載事項）", async () => {
    const text = await renderReceipt();
    expect(text).toContain("合計（消費税10%込）");
  });
});
