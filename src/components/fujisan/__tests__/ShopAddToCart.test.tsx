/**
 * @jest-environment jsdom
 */

// 一覧カードは静的配信なので、ビルド後に売り切れた SKU はサーバー側では判定できない。
// ここで守りたいのは、ハイドレーション後に実勢在庫が効くこと＝
// 「完売なら売らない」「全容量が完売なら他の容量へ誘導しない」
// 「在庫が読めないときは従来どおり売る」の 3 点。
//
// 実勢在庫の取得そのもの（fetch・キャッシュ）は useLiveCatalog の責務なので、
// ここではフックを差し替えて**カードの判定だけ**を見る。

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { skuKey } from "@/data/fujisan-products";

/** 各テストが差し替える実勢カタログ。 */
const live: { current: Record<string, unknown> } = { current: {} };

jest.mock("@/lib/cart/useLiveCatalog", () => ({
  liveKey: (slug: string, ml: number) => `${slug}__${ml}`,
  useLiveCatalog: () => ({ ready: true, catalog: live.current }),
  useLiveSku: (slug: string, ml: number) => live.current[`${slug}__${ml}`],
}));
jest.mock("@/lib/cart/useCart", () => ({ useCart: () => ({ add: jest.fn() }) }));
jest.mock("@/lib/cart/toast-store", () => ({ pushToast: jest.fn() }));

import { ShopAddToCart } from "@/components/fujisan/ShopAddToCart";

type Props = ComponentProps<typeof ShopAddToCart>;

const VOLUMES: Props["volumes"] = [
  { ml: 300, catalogSoldOut: false },
  { ml: 180, catalogSoldOut: false },
];

/** 在庫 1 件ぶんの応答。 */
const sku = (stock: number, soldOut = false, low = false) => ({
  price: 2750,
  stock,
  soldOut,
  low,
});

function renderCard(
  catalog: Record<string, unknown>,
  overrides: Partial<Props> = {},
) {
  live.current = catalog;
  return render(
    <ShopAddToCart
      slug="shogun"
      name="将軍"
      ml={300}
      volumes={VOLUMES}
      {...overrides}
    />,
  );
}

afterEach(() => {
  live.current = {};
});

describe("一覧カードの購入ボタン", () => {
  it("在庫があればカートに追加できる", () => {
    renderCard({
      [skuKey("shogun", 300)]: sku(12),
      [skuKey("shogun", 180)]: sku(12),
    });
    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.queryByText("完売しました")).toBeNull();
  });

  it("実勢在庫が完売なら、ボタンではなく商品ページへの導線を出す", () => {
    // カタログ側は販売中のまま。D1 の在庫だけが 0 になった状況。
    renderCard({
      [skuKey("shogun", 300)]: sku(0, true),
      [skuKey("shogun", 180)]: sku(5),
    });
    // 他の容量が残っているので「完売しました」ではなくそちらへ促す。
    expect(screen.getByText("他の容量を見る")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("全容量が完売なら「完売しました」と出す", () => {
    renderCard({
      [skuKey("shogun", 300)]: sku(0, true),
      [skuKey("shogun", 180)]: sku(0, true),
    });
    expect(screen.getByText("完売しました")).toBeDefined();
  });

  it("在庫僅少なら「残りわずか」を添える（購入は止めない）", () => {
    renderCard({
      [skuKey("shogun", 300)]: sku(2, false, true),
      [skuKey("shogun", 180)]: sku(9),
    });
    expect(screen.getByText("残りわずか")).toBeDefined();
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("実勢在庫が取れていないときはカタログの値で動く（販売を止めない）", () => {
    // 在庫が読めないことを理由に売り止めると、障害がそのまま売り逃しになる。
    renderCard({});
    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.queryByText("完売しました")).toBeNull();
  });

  it("カタログ側で販売停止にした SKU は、在庫があっても売らない", () => {
    renderCard(
      {
        [skuKey("shogun", 300)]: sku(12),
        [skuKey("shogun", 180)]: sku(12),
      },
      {
        volumes: [
          { ml: 300, catalogSoldOut: true },
          { ml: 180, catalogSoldOut: false },
        ],
      },
    );
    expect(screen.getByText("他の容量を見る")).toBeDefined();
  });
});
