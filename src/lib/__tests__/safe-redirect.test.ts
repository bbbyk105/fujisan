/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loginPathFor,
  safeRedirectPath,
  withRedirect,
} from "@/lib/safe-redirect";

// ログイン後の戻り先は URL から読むので、誰でも細工したリンクを踏ませられる。
// 外へ飛ばせると、本物のログイン画面を踏み台にした詐欺に使われる。
describe("safeRedirectPath", () => {
  it.each([
    ["/account"],
    ["/shop/business"],
    ["/cart?resume=checkout"],
    ["/products/shogun#story"],
  ])("サイト内のパス %s はそのまま返す", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    ["https://evil.example/"],
    ["//evil.example/"],
    ["/\\evil.example/"],
    ["\\\\evil.example/"],
    ["/\t/evil.example/"],
    ["/\n/evil.example/"],
    // 解釈の時点では同じサイトで、正規化すると `//evil.example/` になるもの
    ["/.//evil.example/"],
    ["/..//evil.example"],
    ["/a/..//evil.example"],
    ["/./\\evil.example"],
    ["/%2e//evil.example"],
    ["javascript:alert(1)"],
    ["data:text/html,hello"],
    ["cart"],
    [""],
  ])("外へ出る値 %j は受け付けない", (value) => {
    expect(safeRedirectPath(value)).toBeNull();
  });

  it("値が無ければ null を返す", () => {
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
  });

  // Server Action は直接呼べるので、型どおりの値が来るとは限らない。
  it("文字列でなければ、例外にせず null を返す", () => {
    expect(safeRedirectPath(1 as never)).toBeNull();
    expect(safeRedirectPath({} as never)).toBeNull();
  });
});

describe("withRedirect", () => {
  it("戻り先を付けて返す", () => {
    expect(withRedirect("/login/personal", "/cart?resume=checkout")).toBe(
      "/login/personal?redirect=%2Fcart%3Fresume%3Dcheckout",
    );
  });

  it("すでにクエリがあるパスにも付けられる", () => {
    expect(withRedirect("/login/personal?error=google", "/cart")).toBe(
      "/login/personal?error=google&redirect=%2Fcart",
    );
  });

  it("戻り先が無ければ、パスをそのまま返す", () => {
    expect(withRedirect("/login/personal", null)).toBe("/login/personal");
  });
});

describe("loginPathFor", () => {
  it("ログイン画面が読む redirect に戻り先を入れる", () => {
    expect(loginPathFor("/admin/contacts")).toBe(
      `/login/personal?redirect=${encodeURIComponent("/admin/contacts")}`,
    );
  });

  it("絞り込みも含めて戻す", () => {
    const url = new URL(
      loginPathFor("/admin/orders", { filter: "action", from: "2026-11-01" }),
      "https://example.com",
    );

    expect(url.searchParams.get("redirect")).toBe(
      "/admin/orders?filter=action&from=2026-11-01",
    );
  });

  it("値の無い絞り込みは付けない", () => {
    expect(loginPathFor("/admin/customers", { q: "", tab: undefined })).toBe(
      `/login/personal?redirect=${encodeURIComponent("/admin/customers")}`,
    );
  });
});

describe("ログインへの転送", () => {
  // ログイン画面が読むのは redirect だけ。`?next=` と書くと、ログイン後に戻れない。
  it("読まれない ?next= を使っていない", () => {
    const pages = readdirSync(join(__dirname, "../../app"), {
      recursive: true,
      encoding: "utf8",
    }).filter((f) => f.endsWith("page.tsx"));
    const offenders = pages.filter((f) =>
      readFileSync(join(__dirname, "../../app", f), "utf8").includes(
        "/login/personal?next=",
      ),
    );

    expect(offenders).toEqual([]);
  });
});
