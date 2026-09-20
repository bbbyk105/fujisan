import {
  formatDateJp,
  formatDateShortJp,
  formatDateTimeJp,
  formatMonthEn,
  formatMonthJp,
} from "@/lib/format-date";

/**
 * Cloudflare Workers のランタイムは UTC で動く。タイムゾーンを固定しないと
 * JST の 00:00〜09:00 に起きた出来事が 1 日前の日付で表示され、
 * 領収書の発行日や注文日が実際とずれる。
 *
 * ここでは TZ が UTC の環境でも JST で表示されることを確かめる。
 */
describe("JST 固定のフォーマッタ", () => {
  // 2026-09-20T00:30:00Z = JST では 2026-09-20 09:30
  const morningJst = new Date("2026-09-20T00:30:00Z");
  // 2026-09-20T16:00:00Z = JST では 2026-09-21 01:00（UTC だと前日のまま）
  const lateNightJst = new Date("2026-09-20T16:00:00Z");
  // 2026-10-01T00:00:00Z = JST では 2026-10-01 09:00
  const monthBoundary = new Date("2026-09-30T16:00:00Z"); // JST 2026-10-01 01:00

  it("UTC 深夜の出来事を JST の翌日として表示する", () => {
    expect(formatDateJp(lateNightJst)).toBe("2026年9月21日");
    expect(formatDateShortJp(lateNightJst)).toContain("21");
  });

  it("JST 午前の出来事を当日として表示する", () => {
    expect(formatDateJp(morningJst)).toBe("2026年9月20日");
  });

  it("月をまたぐ場合も JST で判定する", () => {
    // UTC では 9/30 だが JST では 10/1
    expect(formatMonthJp(monthBoundary)).toBe("2026年10月");
    expect(formatMonthEn(monthBoundary)).toBe("October 2026");
  });

  it("日時表示も JST で出す", () => {
    const s = formatDateTimeJp(lateNightJst);
    expect(s).toContain("21");
    expect(s).toContain("01:00");
  });

  it("環境の TZ に依存しない（UTC でも JST 表示になる）", () => {
    // jest は既定で TZ 未指定 = ホストの TZ。ホストが UTC でも結果が変わらないこと。
    const original = process.env.TZ;
    try {
      process.env.TZ = "UTC";
      expect(formatDateJp(lateNightJst)).toBe("2026年9月21日");
      process.env.TZ = "America/Los_Angeles";
      expect(formatDateJp(lateNightJst)).toBe("2026年9月21日");
    } finally {
      process.env.TZ = original;
    }
  });
});
