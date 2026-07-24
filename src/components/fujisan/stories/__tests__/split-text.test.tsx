import { render } from "@testing-library/react";
import { Chars, Words } from "../split-text";

describe("<Chars> — 一文字ずつの分割", () => {
  it("各文字を指定クラスの <span> に割る", () => {
    const { container } = render(
      <Chars text="富士山酒物語" className="hero-char" />,
    );

    const spans = container.querySelectorAll("span.hero-char");
    expect(spans).toHaveLength(6);
    expect([...spans].map((s) => s.textContent).join("")).toBe("富士山酒物語");
  });

  it("スペースは NBSP として保持する（連続スペースの潰れ防止）", () => {
    const { container } = render(<Chars text="A B" className="c" />);
    const spans = container.querySelectorAll("span.c");
    expect(spans).toHaveLength(3);
    expect(spans[1].textContent).toBe(" ");
  });
});

describe("<Words> — 単語ごとの分割", () => {
  it("単語を指定クラスの <span> に割る（マスクなし）", () => {
    const { container } = render(
      <Words text="STORIES OF FUJISAN" className="story-char" />,
    );

    const spans = container.querySelectorAll("span.story-char");
    expect(spans).toHaveLength(3);
    expect([...spans].map((s) => s.textContent)).toEqual([
      "STORIES",
      "OF",
      "FUJISAN",
    ]);
  });

  it("masked 指定時は overflow-hidden のラッパーで各単語を包む", () => {
    const { container } = render(
      <Words text="STORIES OF FUJISAN" className="hero-word" masked />,
    );

    const words = container.querySelectorAll("span.hero-word");
    expect(words).toHaveLength(3);
    words.forEach((w) => {
      expect(w.parentElement?.classList.contains("overflow-hidden")).toBe(true);
    });
  });
});
