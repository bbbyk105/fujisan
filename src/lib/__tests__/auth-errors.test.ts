import { classifyAuthError } from "@/lib/auth-errors";

describe("classifyAuthError", () => {
  it("classifies unverified email (status 403 / code / message)", () => {
    expect(classifyAuthError({ status: 403, code: "EMAIL_NOT_VERIFIED" })).toBe(
      "unverified",
    );
    expect(classifyAuthError({ message: "Email not verified" })).toBe(
      "unverified",
    );
    expect(classifyAuthError({ body: { code: "EMAIL_NOT_VERIFIED" } })).toBe(
      "unverified",
    );
  });

  it("classifies invalid credentials and does NOT fall through to weak", () => {
    expect(
      classifyAuthError({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" }),
    ).toBe("invalid");
    // code contains both INVALID and PASSWORD — must resolve to invalid
    expect(classifyAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "invalid",
    );
  });

  it("classifies already-existing account", () => {
    expect(classifyAuthError({ status: 422, code: "USER_ALREADY_EXISTS" })).toBe(
      "exists",
    );
  });

  it("classifies weak password", () => {
    expect(classifyAuthError({ code: "PASSWORD_TOO_SHORT" })).toBe("weak");
    expect(
      classifyAuthError({ message: "Password must be at least 8 characters" }),
    ).toBe("weak");
  });

  // changePassword は「現在のパスワードが違う」も「新しいのが短い」も
  // PASSWORD を含むコードで飛んでくる。取り違えると案内が正反対になる。
  it("classifies a wrong current password as invalid, not weak", () => {
    expect(classifyAuthError({ code: "INVALID_PASSWORD" })).toBe("invalid");
    expect(
      classifyAuthError({ body: { code: "INVALID_PASSWORD" } }),
    ).toBe("invalid");
    expect(
      classifyAuthError({ message: "Invalid password" }),
    ).toBe("invalid");
  });

  it("distinguishes a too-long password from a too-short one", () => {
    expect(classifyAuthError({ code: "PASSWORD_TOO_LONG" })).toBe("too-long");
    expect(classifyAuthError({ code: "PASSWORD_TOO_SHORT" })).toBe("weak");
  });

  it("classifies an account with no password (Google-only sign-in)", () => {
    expect(classifyAuthError({ code: "CREDENTIAL_ACCOUNT_NOT_FOUND" })).toBe(
      "no-password",
    );
  });

  it("falls back to generic for unknown / null", () => {
    expect(classifyAuthError(null)).toBe("generic");
    expect(classifyAuthError(undefined)).toBe("generic");
    expect(classifyAuthError(new Error("boom"))).toBe("generic");
    expect(classifyAuthError({ message: "Something unexpected" })).toBe(
      "generic",
    );
  });
});
