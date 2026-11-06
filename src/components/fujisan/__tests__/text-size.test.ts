import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 小さすぎる文字と薄すぎる文字を増やさない（AGENTS.md「文字の大きさ」）。
 * 短いラベルでも 12px。14px 未満の藍の文字は /65（和紙の上で約 5.3:1）より薄くしない。
 */
const MIN_PX = 12;
const SMALL_PX = 14;
const MIN_INDIGO = 65;
/** 未成年飲酒防止の表示。10 ポイント（約 13.3px）を下回らないようにする */
const NOTICE_MIN_PX = 14;

const PX_CLASS = /text-\[(\d+(?:\.\d+)?)px\]/g;
const PX_INLINE = /fontSize:\s*"(\d+(?:\.\d+)?)px"/g;
// hover: などの接頭辞が付いた指定は、その状態のときだけの色なので見ない
const INDIGO_TEXT = /(?<![\w:/-])text-indigo\/(\d+)/g;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : tsxFiles(path);
    }
    return name.endsWith(".tsx") ? [path] : [];
  });
}

const files = ["src/app", "src/components", "src/i18n"].flatMap(tsxFiles);

function sizesOf(line: string): number[] {
  return [...line.matchAll(PX_CLASS), ...line.matchAll(PX_INLINE)].map((m) =>
    Number(m[1]),
  );
}

function linesWhere(test: (line: string) => boolean): string[] {
  return files.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, i) => (test(line) ? [`${file}:${i + 1}`] : [])),
  );
}

describe("文字の大きさ", () => {
  it("12px より小さい文字を指定しない", () => {
    expect(
      linesWhere((line) => sizesOf(line).some((px) => px < MIN_PX)),
    ).toEqual([]);
  });

  it("globals.css でも 12px より小さい文字を指定しない", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const sizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(
      (m) => Number(m[1]),
    );

    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((px) => px < MIN_PX)).toEqual([]);
  });

  it("14px 未満の文字を薄くしない", () => {
    expect(
      linesWhere((line) => {
        const sizes = sizesOf(line);
        if (sizes.length === 0 || Math.min(...sizes) >= SMALL_PX) return false;
        return [...line.matchAll(INDIGO_TEXT)].some(
          (m) => Number(m[1]) < MIN_INDIGO,
        );
      }),
    ).toEqual([]);
  });

  it("薄い地の説明文の色と、注記の文字を基準より下げない", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toMatch(/--ed-muted: rgba\(11, 26, 46, 0\.66\)/);
    expect(css).toMatch(/\.ed-small \{\s*font-size: 13px/);
    expect(css).toMatch(/\.ed-note \.ed-p \{[^}]*font-size: 14px/);
  });
});

describe("未成年飲酒防止の表示", () => {
  const box = (file: string, marker: string): string => {
    const source = readFileSync(file, "utf8");
    const at = source.indexOf(marker);
    expect(at).toBeGreaterThanOrEqual(0);
    return source.slice(at, at + 400);
  };

  it.each([
    ["フッター", "src/components/fujisan/FujisanFooter.tsx", 'role="note"'],
    ["年齢確認", "src/components/fujisan/AgeGate.tsx", 'id="age-gate-desc"'],
    [
      "納品書",
      "src/app/admin/orders/[orderRef]/packing-slip/page.tsx",
      "{UNDERAGE_NOTICE_JP}",
    ],
  ])("%s は 14px 以上で出す", (_name, file, marker) => {
    const source = readFileSync(file, "utf8");
    const at = source.indexOf(marker);
    expect(at).toBeGreaterThanOrEqual(0);
    const around = source.slice(Math.max(0, at - 240), at + 240);
    const sizes = sizesOf(around);

    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(NOTICE_MIN_PX);
  });

  it("カートでは合計の金額より小さくしない", () => {
    const file = "src/components/fujisan/cart/CartView.tsx";
    const [noticePx] = sizesOf(box(file, "申込みの年齢確認のすぐ近くに置く表示"));
    const [totalPx] = sizesOf(box(file, "金額は年齢確認より小さくする"));

    expect(noticePx).toBeGreaterThanOrEqual(totalPx);
  });
});
