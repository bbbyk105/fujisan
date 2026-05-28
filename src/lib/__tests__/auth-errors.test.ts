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

  it("falls back to generic for unknown / null", () => {
    expect(classifyAuthError(null)).toBe("generic");
    expect(classifyAuthError(undefined)).toBe("generic");
    expect(classifyAuthError(new Error("boom"))).toBe("generic");
    expect(classifyAuthError({ message: "Something unexpected" })).toBe(
      "generic",
    );
  });
});
