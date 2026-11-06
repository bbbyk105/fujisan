import { render, screen } from "@testing-library/react";
import { fujisanProducts } from "@/data/fujisan-products";

// 空のカート。売れ行きの根拠が無いので「人気」とは書かず、全銘柄を並べる。

jest.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false, refetch: jest.fn() }),
}));

jest.mock("@/lib/actions/checkout", () => ({
  startCheckoutAction: jest.fn(),
  releaseAbandonedCheckoutAction: jest.fn(),
}));

let mockCatalog: Record<string, { soldOut: boolean; stock: number | null }> = {};
jest.mock("@/lib/cart/useLiveCatalog", () => ({
  useLiveCatalog: () => ({ catalog: mockCatalog }),
  useLiveSku: () => undefined,
  liveKey: (slug: string, ml: number) => `${slug}-${ml}`,
  refreshLiveCatalog: jest.fn(),
}));

jest.mock("@/lib/cart/useCart", () => ({
  useCart: () => ({
    ready: true,
    lines: [],
    count: 0,
    subtotal: 0,
    add: jest.fn(),
    setQty: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock("@/components/fujisan/cart/TurnstileWidget", () => ({
  TurnstileWidget: () => null,
}));

import { CartView } from "@/components/fujisan/cart/CartView";

beforeEach(() => {
  mockCatalog = {};
});

describe("CartView — 空のカート", () => {
  it("空であることは 1 文だけで伝える", () => {
    const { container } = render(<CartView />);

    expect(container.textContent).toContain("カートに商品は入っていません。");
    expect(container.textContent).not.toContain("まだ、何も入っていません");
  });

  it("「人気」とは書かず、全銘柄を並べる", () => {
    const { container } = render(<CartView />);

    expect(container.textContent).not.toContain("人気");
    expect(container.textContent).not.toContain("Popular");
    expect(screen.getAllByRole("button", { name: /追加/ })).toHaveLength(
      fujisanProducts.length,
    );
  });

  it("完売の銘柄は追加できない", () => {
    const last = fujisanProducts[fujisanProducts.length - 1];
    mockCatalog = {
      [`${last.slug}-${last.volumes[0].ml}`]: { soldOut: true, stock: 0 },
    };
    const { container } = render(<CartView />);

    expect(screen.getAllByRole("button", { name: /追加/ })).toHaveLength(
      fujisanProducts.length - 1,
    );
    expect(container.textContent).toContain("完売");
  });
});
