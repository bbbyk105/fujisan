import { render } from "@testing-library/react";
import { L } from "@/i18n/Localized";

describe("<L> bilingual fragment", () => {
  it("renders both ja and en fragments with locale-control classes", () => {
    const { container } = render(<L ja="日本語テキスト" en="English text" />);

    const ja = container.querySelector(".i18n-ja");
    const en = container.querySelector(".i18n-en");

    expect(ja).not.toBeNull();
    expect(en).not.toBeNull();
    expect(ja?.textContent).toBe("日本語テキスト");
    expect(en?.textContent).toBe("English text");
    // both carry the layout-transparent wrapper class
    expect(ja?.classList.contains("i18n-fragment")).toBe(true);
    expect(en?.classList.contains("i18n-fragment")).toBe(true);
  });
});
