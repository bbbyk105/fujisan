import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 和文の小さなラベルの字間を広げない（AGENTS.md「編集レイヤー」）。
 * 広い字間は読みにくく、英語の見出しの作法をなぞった見え方になる。
 */
const WIDE = /tracking-\[0?\.(1[0-9]|[2-9][0-9]?)em\]/;

/** 凍結ページとその部品、英字や数字だけの表記、印刷物の表題。 */
const ALLOWED = [
  "src/app/page.tsx",
  "src/app/products/page.tsx",
  "src/app/admin/orders/[orderRef]/packing-slip/page.tsx",
  "src/components/fujisan/FujisanHero.tsx",
  "src/components/fujisan/FujisanHeroShowcase.tsx",
  "src/components/fujisan/FujisanDiscover.tsx",
  "src/components/fujisan/FujisanExperience.tsx",
  "src/components/fujisan/FujisanGuide.tsx",
  "src/components/fujisan/FujisanInnerHero.tsx",
  "src/components/fujisan/ProductCollectionBottles.tsx",
  "src/components/fujisan/ShopAddToCart.tsx",
  "src/components/fujisan/SoldOutBadge.tsx",
  "src/components/fujisan/FujisanNavClient.tsx",
  "src/components/fujisan/CartNavLink.tsx",
  "src/components/fujisan/auth/AccountNavLink.tsx",
  "src/components/fujisan/FujisanContactForm.tsx",
  "src/components/fujisan/auth/CancelOrderButton.tsx",
  "src/i18n/LocaleSwitch.tsx",
];

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : tsxFiles(path);
    }
    return name.endsWith(".tsx") ? [path] : [];
  });
}

describe("字間", () => {
  it("許した部品のほかで、広い字間を指定しない", () => {
    const found = ["src/app", "src/components", "src/i18n"]
      .flatMap(tsxFiles)
      .filter((f) => !ALLOWED.includes(f))
      .filter((f) => WIDE.test(readFileSync(f, "utf8")));

    expect(found).toEqual([]);
  });
});
