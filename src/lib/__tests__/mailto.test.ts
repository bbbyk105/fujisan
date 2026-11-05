/**
 * @jest-environment node
 */

// 宛先は公開フォームから入る値。`?` や `&` で BCC や本文を差し込めないこと。

import { gmailComposeHref, mailtoHref } from "@/lib/mailto";

describe("mailtoHref", () => {
  it("普通の宛先はそのまま読める形で返す", () => {
    expect(mailtoHref("sato@example.com")).toBe("mailto:sato@example.com");
  });

  it("件名を符号化して付ける", () => {
    expect(mailtoHref("sato@example.com", "Re: 卸 & 取扱店")).toBe(
      `mailto:sato@example.com?subject=${encodeURIComponent("Re: 卸 & 取扱店")}`,
    );
  });

  it.each([
    "x@example.com?bcc=evil%40attacker.example&a=",
    "x@example.com&bcc=evil@attacker.example",
    "x?bcc=evil@example.com",
    "x@example.com#fragment",
  ])("%s から宛先以外を作らせない", (email) => {
    const url = new URL(mailtoHref(email));

    expect([...url.searchParams.keys()]).toEqual([]);
    expect(url.hash).toBe("");
    expect(decodeURIComponent(url.pathname)).toBe(email);
  });

  // 公開フォームの値で例外になると、管理画面の描画が丸ごと止まる。
  it("壊れた文字が入っていても例外にしない", () => {
    expect(() => mailtoHref("\ud800@example.com", "件名")).not.toThrow();
  });

  it("件名は 1 つだけになる", () => {
    const url = new URL(mailtoHref("x@example.com?bcc=e@a.example", "件名"));
    expect([...url.searchParams.keys()]).toEqual(["subject"]);
  });
});

describe("gmailComposeHref", () => {
  it("空白を + にしない（件名にそのまま出ないよう %20 にする）", () => {
    const href = gmailComposeHref(
      "a+b@example.com",
      "Re: 件名 two words",
      "shop@example.com",
    );

    expect(href).toContain("Re%3A%20");
    expect(href).not.toContain("+");
    expect(new URL(href).searchParams.get("to")).toBe("a+b@example.com");
    expect(new URL(href).searchParams.get("authuser")).toBe("shop@example.com");
  });

  it("壊れた文字が入っていても例外にしない", () => {
    expect(() =>
      gmailComposeHref("\ud800@example.com", "件名", "shop@example.com"),
    ).not.toThrow();
  });
});
