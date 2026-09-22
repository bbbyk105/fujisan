import {
  getFieldErrors,
  isEmailLike,
  loginSchema,
  registerPersonalSchema,
  registerBusinessSchema,
  contactSchema,
  CONTACT_MESSAGE_MAX,
} from "@/lib/validation/forms";

describe("isEmailLike", () => {
  it("accepts valid emails (trimming whitespace)", () => {
    expect(isEmailLike("a@b.com")).toBe(true);
    expect(isEmailLike("  user.name@example.co.jp  ")).toBe(true);
  });
  it("rejects malformed or empty values", () => {
    expect(isEmailLike("")).toBe(false);
    expect(isEmailLike("nope")).toBe(false);
    expect(isEmailLike("a@b")).toBe(false);
    expect(isEmailLike("a b@c.com")).toBe(false);
  });
});

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
  const base = {
    companyName: "鮨青山",
    contactName: "佐々木",
    email: "a@b.com",
    password: "password1",
    businessType: "restaurant",
  };

  it("passes with required fields (phone/address optional)", () => {
    expect(getFieldErrors(registerBusinessSchema, base)).toEqual({});
  });
  it("flags missing company and contact", () => {
    const errs = getFieldErrors(registerBusinessSchema, {
      ...base,
      companyName: "",
      contactName: "",
    });
    expect(errs.companyName).toBe("required");
    expect(errs.contactName).toBe("required");
  });

  it("requires a business type, and rejects unknown codes", () => {
    // 未選択でも zod 既定の英文ではなく FieldErrorKey が返ること。
    const { businessType, ...withoutType } = base;
    void businessType;
    expect(getFieldErrors(registerBusinessSchema, withoutType).businessType).toBe(
      "required",
    );
    expect(
      getFieldErrors(registerBusinessSchema, { ...base, businessType: "bank" })
        .businessType,
    ).toBe("required");
  });

  it("requires a licence number only from businesses that resell", () => {
    // 転売する業態（小売・卸）だけ免許が要る。
    for (const type of ["retailer", "wholesaler"]) {
      expect(
        getFieldErrors(registerBusinessSchema, { ...base, businessType: type })
          .licenceNumber,
      ).toBe("required");
      expect(
        getFieldErrors(registerBusinessSchema, {
          ...base,
          businessType: type,
          licenceNumber: "静岡税務署 第123号",
        }),
      ).toEqual({});
    }
    // 店内で提供するだけの業態に免許を求めると、正しい相手を弾いてしまう。
    for (const type of ["restaurant", "hotel", "other"]) {
      expect(
        getFieldErrors(registerBusinessSchema, { ...base, businessType: type }),
      ).toEqual({});
    }
  });

  it("treats a whitespace-only licence number as missing", () => {
    expect(
      getFieldErrors(registerBusinessSchema, {
        ...base,
        businessType: "retailer",
        licenceNumber: "   ",
      }).licenceNumber,
    ).toBe("required");
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
  it("caps the message length in the schema, not just the textarea", () => {
    // textarea の maxLength はブラウザの入力補助でしかない。Server Action は
    // 直接呼べるので、上限はスキーマ側で持っていないと巨大な行が保存できてしまう。
    const base = {
      name: "佐藤",
      email: "a@b.com",
      subject: "general",
      message: "あ".repeat(CONTACT_MESSAGE_MAX),
    };
    expect(getFieldErrors(contactSchema, base)).toEqual({});
    expect(
      getFieldErrors(contactSchema, {
        ...base,
        message: "あ".repeat(CONTACT_MESSAGE_MAX + 1),
      }),
    ).toEqual({ message: "long" });
  });

  it("caps name and email length too", () => {
    const base = {
      name: "佐藤",
      email: "a@b.com",
      subject: "general",
      message: "こんにちは",
    };
    expect(
      getFieldErrors(contactSchema, { ...base, name: "あ".repeat(101) }),
    ).toEqual({ name: "long" });
    expect(
      getFieldErrors(contactSchema, {
        ...base,
        email: `${"a".repeat(250)}@b.com`,
      }),
    ).toEqual({ email: "long" });
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
