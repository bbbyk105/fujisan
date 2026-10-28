/**
 * @jest-environment node
 */

import robots from "@/app/robots";

describe("robots", () => {
  it("認証フローのページはクロールさせない（確認完了ページも含む）", () => {
    const { rules } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    for (const path of [
      "/login/",
      "/register/",
      "/forgot-password/",
      "/reset-password",
      "/email-verified",
    ]) {
      expect(rule.disallow).toContain(path);
    }
  });
});
