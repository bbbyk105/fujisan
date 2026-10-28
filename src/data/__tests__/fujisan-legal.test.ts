import {
  INVOICE_REGISTRATION_NUMBER,
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

describe("適格請求書発行事業者の登録番号", () => {
  // 法人の登録番号は "T" + 法人番号。法人番号の先頭 1 桁は残り 12 桁から計算する
  // 検査用数字なので、1 桁の打ち間違いはここで分かる。間違えたまま出すと、
  // 別の事業者の番号を領収書に載せることになる。
  function hasValidCheckDigit(corporateNumber: string): boolean {
    const base = corporateNumber.slice(1);
    let sum = 0;
    for (let n = 1; n <= 12; n++) {
      sum += Number(base[12 - n]) * (n % 2 === 1 ? 1 : 2);
    }
    return Number(corporateNumber[0]) === 9 - (sum % 9);
  }

  it("登録済みの番号を持ち、T と 13 桁で検査用数字が合っている", () => {
    expect(INVOICE_REGISTRATION_NUMBER).toMatch(/^T\d{13}$/);
    expect(hasValidCheckDigit(INVOICE_REGISTRATION_NUMBER!.slice(1))).toBe(true);
  });

  it("検査用数字の計算は 1 桁の違いを見分ける", () => {
    expect(hasValidCheckDigit("4080103000596")).toBe(true);
    expect(hasValidCheckDigit("5080103000596")).toBe(false);
    expect(hasValidCheckDigit("4080103000597")).toBe(false);
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
