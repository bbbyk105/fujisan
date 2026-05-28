import {
  getFieldErrors,
  loginSchema,
  registerPersonalSchema,
  registerBusinessSchema,
  contactSchema,
  wholesaleSchema,
} from "@/lib/validation/forms";

describe("loginSchema", () => {
  it("passes with email + password", () => {
    expect(
      getFieldErrors(loginSchema, { email: "a@b.com", password: "secret" }),
    ).toEqual({});
  });
  it("flags empty fields as required", () => {
    expect(getFieldErrors(loginSchema, { email: "", password: "" })).toEqual({
      email: "required",
      password: "required",
    });
  });
  it("flags malformed email", () => {
    expect(
      getFieldErrors(loginSchema, { email: "nope", password: "x" }),
    ).toEqual({ email: "email" });
  });
});

describe("registerPersonalSchema", () => {
  it("passes with valid input", () => {
    expect(
      getFieldErrors(registerPersonalSchema, {
        name: "佐藤",
        email: "a@b.com",
        password: "password1",
      }),
    ).toEqual({});
  });
  it("flags short password", () => {
    expect(
      getFieldErrors(registerPersonalSchema, {
        name: "佐藤",
        email: "a@b.com",
        password: "short",
      }),
    ).toEqual({ password: "min8" });
  });
  it("flags missing name", () => {
    const errs = getFieldErrors(registerPersonalSchema, {
      name: "   ",
      email: "a@b.com",
      password: "password1",
    });
    expect(errs.name).toBe("required");
  });
});

describe("registerBusinessSchema", () => {
  it("passes with required fields (phone/address optional)", () => {
    expect(
      getFieldErrors(registerBusinessSchema, {
        companyName: "鮨青山",
        contactName: "佐々木",
        email: "a@b.com",
        password: "password1",
      }),
    ).toEqual({});
  });
  it("flags missing company and contact", () => {
    const errs = getFieldErrors(registerBusinessSchema, {
      companyName: "",
      contactName: "",
      email: "a@b.com",
      password: "password1",
    });
    expect(errs.companyName).toBe("required");
    expect(errs.contactName).toBe("required");
  });
});

describe("contactSchema", () => {
  it("passes with all fields", () => {
    expect(
      getFieldErrors(contactSchema, {
        name: "佐藤",
        email: "a@b.com",
        subject: "general",
        message: "こんにちは",
      }),
    ).toEqual({});
  });
  it("flags empty message and bad email", () => {
    const errs = getFieldErrors(contactSchema, {
      name: "佐藤",
      email: "bad",
      subject: "general",
      message: "",
    });
    expect(errs.email).toBe("email");
    expect(errs.message).toBe("required");
  });
});

describe("wholesaleSchema", () => {
  const base = {
    company: "鮨青山",
    contactName: "佐々木",
    email: "a@b.com",
    country: "Japan",
    website: "",
    licenseConfirmed: true,
  };
  it("passes with empty optional website and license confirmed", () => {
    expect(getFieldErrors(wholesaleSchema, base)).toEqual({});
  });
  it("requires the licence confirmation", () => {
    expect(
      getFieldErrors(wholesaleSchema, { ...base, licenseConfirmed: false }),
    ).toEqual({ licenseConfirmed: "agree" });
  });
  it("validates website URL when provided", () => {
    expect(
      getFieldErrors(wholesaleSchema, { ...base, website: "not-a-url" }),
    ).toEqual({ website: "url" });
    expect(
      getFieldErrors(wholesaleSchema, {
        ...base,
        website: "https://example.com",
      }),
    ).toEqual({});
  });
});
