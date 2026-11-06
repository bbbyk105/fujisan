/**
 * @jest-environment jsdom
 */

// 免許番号は掲示しないので、特商法ページへの案内に免許の情報があると書かない。

import { render } from "@testing-library/react";
import FujisanFooter from "@/components/fujisan/FujisanFooter";

describe("フッターの法定表示への案内", () => {
  it("酒類販売管理者標識だけを案内する", () => {
    const text = render(<FujisanFooter />).container.textContent ?? "";
    expect(text).toContain("酒類販売管理者標識はこちら");
    expect(text).not.toContain("免許情報");
    expect(text).not.toContain("retail licence");
  });
});

describe("フッターのリンク", () => {
  it("日本語の名前を持つ", () => {
    const { container } = render(<FujisanFooter />);
    const names = [...container.querySelectorAll("li a")].map(
      (a) => a.textContent ?? "",
    );

    for (const ja of [
      "特定商取引法に基づく表示",
      "プライバシーポリシー",
      "利用規約",
      "お届けと返品",
      "よくあるご質問",
    ]) {
      expect(names.some((n) => n.includes(ja))).toBe(true);
    }
    expect(container.textContent).not.toContain("PRIVACY POLICY");
    expect(container.textContent).not.toContain("ALL RIGHTS RESERVED");
  });
});
