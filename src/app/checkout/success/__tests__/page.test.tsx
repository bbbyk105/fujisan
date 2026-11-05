import { render, screen } from "@testing-library/react";

// ゲストには注文を見るページが無い。完了画面から入れない先へ案内しない。

const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  getSession: (...a: unknown[]) => getSession(...a),
}));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { STRIPE_SECRET_KEY: "sk_test_1" },
  }),
}));
jest.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: async () => ({
          metadata: { orderRef: "FJ-0001" },
          amount_total: 3850,
          payment_status: "paid",
        }),
      },
    },
  }),
}));
jest.mock("@/components/fujisan/editorial/EditorialPage", () => ({
  EditorialPage: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
jest.mock("@/components/fujisan/cart/ClearCartOnMount", () => ({
  ClearCartOnMount: () => null,
}));

import CheckoutSuccessPage from "@/app/checkout/success/page";

const page = () =>
  CheckoutSuccessPage({ searchParams: Promise.resolve({ session_id: "cs_1" }) });

const hrefs = () =>
  screen.getAllByRole("link").map((a) => a.getAttribute("href"));

describe("/checkout/success", () => {
  it("会員には注文の確認ページを案内する", async () => {
    getSession.mockResolvedValue({ user: { id: "u_1" } });
    render(await page());

    expect(hrefs()).toContain("/account");
    expect(hrefs()).not.toContain("/contact");
  });

  it("ゲストにはお問い合わせを案内し、アカウントのページへは案内しない", async () => {
    getSession.mockResolvedValue(null);
    render(await page());

    expect(hrefs()).toContain("/contact");
    expect(hrefs()).not.toContain("/account");
  });

  it("ログインの状態が読めなくても、完了画面は出す", async () => {
    getSession.mockRejectedValue(new Error("d1 unavailable"));
    render(await page());

    expect(screen.getByText("FJ-0001")).toBeTruthy();
    expect(hrefs()).not.toContain("/account");
  });
});
