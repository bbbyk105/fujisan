import {
  rememberAgeConfirmed,
  takeAgeConfirmed,
} from "@/lib/cart/checkout-resume";

// 酒類の確認なので、古い記録で通さない。
describe("20 歳以上の確認の記録", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-05T00:00:00Z"));
  });

  afterEach(() => jest.useRealTimers());

  it("確認の直後なら使える", () => {
    rememberAgeConfirmed();

    expect(takeAgeConfirmed()).toBe(true);
  });

  it("1 回しか使えない", () => {
    rememberAgeConfirmed();
    takeAgeConfirmed();

    expect(takeAgeConfirmed()).toBe(false);
  });

  it("時間が経った記録は使えない", () => {
    rememberAgeConfirmed();
    jest.advanceTimersByTime(31 * 60 * 1000);

    expect(takeAgeConfirmed()).toBe(false);
  });

  it("確認していなければ使えない", () => {
    expect(takeAgeConfirmed()).toBe(false);
  });
});
