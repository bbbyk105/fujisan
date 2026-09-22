import {
  LIQUOR_LICENCE,
  SHIPPING_FEE,
  isLiquorLicenceDisclosed,
  liquorLicenceLine,
} from "@/data/fujisan-legal";

describe("通信販売酒類小売業免許の表示", () => {
  const original = { ...LIQUOR_LICENCE };
  afterEach(() => {
    LIQUOR_LICENCE.taxOffice = original.taxOffice;
    LIQUOR_LICENCE.number = original.number;
  });

  it("番号が確定したら税務署名と番号を掲示する", () => {
    LIQUOR_LICENCE.taxOffice = "富士税務署";
    LIQUOR_LICENCE.number = "酒類指令第12号";

    expect(isLiquorLicenceDisclosed()).toBe(true);
    expect(liquorLicenceLine("ja")).toBe(
      "通信販売酒類小売業免許（富士税務署 酒類指令第12号）",
    );
    expect(liquorLicenceLine("en")).toContain("富士税務署");
    expect(liquorLicenceLine("en")).toContain("酒類指令第12号");
  });

  it("未確定のあいだは番号を作り出さず、確認中である旨を出す", () => {
    LIQUOR_LICENCE.taxOffice = null;
    LIQUOR_LICENCE.number = null;

    expect(isLiquorLicenceDisclosed()).toBe(false);
    const ja = liquorLicenceLine("ja");
    expect(ja).toContain("確認中");
    // それらしい伏せ字や null がそのまま画面に出てはいけない
    expect(ja).not.toContain("〇");
    expect(ja).not.toContain("null");
    expect(liquorLicenceLine("en")).not.toContain("null");
  });

  it("片方だけ埋まっている状態は「未確定」として扱う", () => {
    LIQUOR_LICENCE.taxOffice = "富士税務署";
    LIQUOR_LICENCE.number = null;
    expect(isLiquorLicenceDisclosed()).toBe(false);

    LIQUOR_LICENCE.taxOffice = null;
    LIQUOR_LICENCE.number = "酒類指令第12号";
    expect(isLiquorLicenceDisclosed()).toBe(false);
  });

  it("空白だけの値も未確定として扱う", () => {
    LIQUOR_LICENCE.taxOffice = "   ";
    LIQUOR_LICENCE.number = "酒類指令第12号";
    expect(isLiquorLicenceDisclosed()).toBe(false);
  });
});

describe("送料表記", () => {
  it("決済で課金されない追加オプションを表記に含めない", () => {
    // クール便の加算（+330円）は選択 UI も課金処理も無いまま表記だけ存在していた。
    // 実装せずに文言だけ戻すと、表示額と請求額が食い違う。
    const text = Object.values(SHIPPING_FEE).join(" ");
    expect(text).not.toContain("クール便");
    expect(text).not.toContain("Cool-chain");
  });

  it("金額は円の整数（JPY は小数を持たない）", () => {
    expect(Number.isInteger(SHIPPING_FEE.flatJpy)).toBe(true);
    expect(Number.isInteger(SHIPPING_FEE.freeThresholdJpy)).toBe(true);
  });
});
