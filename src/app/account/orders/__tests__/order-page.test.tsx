/**
 * @jest-environment jsdom
 */

// 一部返金した注文の案内。品物が蔵を出たあとに「このまま発送いたします」と出すと、
// もう一度届くと読めてしまう。

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
jest.mock("@/components/fujisan/editorial/EditorialPage", () => ({
  EditorialPage: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
jest.mock("@/components/reveal/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/fujisan/auth/ReorderButton", () => ({
  ReorderButton: () => null,
}));
jest.mock("@/components/fujisan/auth/CancelOrderButton", () => ({
  CancelOrderButton: () => null,
}));

import OrderPage from "@/app/account/orders/[orderRef]/page";

const ORDER = {
  orderRef: "FJ-0001",
  status: "preparing",
  items: [],
  itemsCount: 1,
  subtotal: 2750,
  shipping: 1100,
  total: 3850,
  customerName: "山田 太郎",
  customerEmail: "taro@example.com",
  postalCode: "4170051",
  address: "静岡県富士市吉原",
  phone: "",
  trackingCarrier: null,
  trackingNumber: null,
  shippedAt: null,
  deliveredAt: null,
  paidAt: null,
  cancelRequestedAt: null,
  refundedAmount: 1100,
  refundedAt: new Date("2026-10-15T01:00:00Z"),
  createdAt: new Date("2026-10-01T01:00:00Z"),
  updatedAt: new Date("2026-10-15T01:00:00Z"),
} as unknown as OrderRecord;

async function pageText(overrides: Partial<OrderRecord>) {
  getMyOrderByRefAction.mockResolvedValue({ ...ORDER, ...overrides });
  const page = await OrderPage({
    params: Promise.resolve({ orderRef: "FJ-0001" }),
  });
  return render(page).container.textContent ?? "";
}

describe("一部返金の案内", () => {
  it("発送前の注文には、このまま発送することを出す", async () => {
    expect(await pageText({ status: "preparing" })).toContain(
      "ご注文はこのまま発送いたします",
    );
  });

  it("キャンセルを依頼された注文には出さない", async () => {
    const text = await pageText({
      status: "confirmed",
      cancelRequestedAt: new Date("2026-10-02T01:00:00Z"),
    });
    expect(text).not.toContain("このまま発送いたします");
  });

  it.each(["shipped", "delivered", "cancelled"] as const)(
    "発送しない注文（%s）には出さない",
    async (status) => {
      const text = await pageText({ status });
      expect(text).not.toContain("このまま発送いたします");
      expect(text).toContain("差引ご負担額");
    },
  );
});
