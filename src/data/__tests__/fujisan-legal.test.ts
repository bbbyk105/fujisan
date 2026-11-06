import {
  INVOICE_REGISTRATION_NUMBER,
  SHIPPING_FEE,
  SHIPPING_REGIONS,
} from "@/data/fujisan-legal";

describe("適格請求書発行事業者の登録番号", () => {
  // 法人の登録番号は "T" + 法人番号。法人番号の先頭 1 桁は残り 12 桁から計算する
  // 検査用数字なので、打ち間違いの多くはここで分かる。間違えたまま出すと、
  // 別の事業者の番号を領収書に載せることになる。ただし 9 で割った余りで作るため、
  // 0 と 9 の取り違えは見分けられない。番号を変えたら国税庁の公表サイト
  // （invoice-kohyo.nta.go.jp）でも名称を照合すること。
  // T4080103000596 は 2026-10-29 に照合済み（株式会社近藤薬局・2023-10-01 登録。
  // 6〜7 桁目が株式会社の 01 でなく 03 なのは、合資会社から組織を変えたため）。
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
    for (const { surchargeJpy } of Object.values(SHIPPING_REGIONS)) {
      expect(Number.isInteger(surchargeJpy)).toBe(true);
    }
  });

  it("表記は地域の追加額を金額で示す", () => {
    expect(SHIPPING_FEE.remote).toContain("500円");
    expect(SHIPPING_FEE.remote).toContain("1,700円");
    expect(SHIPPING_FEE.flat).not.toContain("全国一律");
  });
});
