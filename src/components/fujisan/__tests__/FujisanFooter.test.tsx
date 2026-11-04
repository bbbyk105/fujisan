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
