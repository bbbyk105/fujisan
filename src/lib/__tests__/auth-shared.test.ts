import { additionalUserFields, ACCOUNT_ROLES } from "@/lib/auth-shared";

describe("auth-shared", () => {
  it("role field defaults to personal", () => {
    expect(additionalUserFields.role.defaultValue).toBe("personal");
    expect(additionalUserFields.role.type).toBe("string");
  });

  it("declares the business-account custom fields", () => {
    expect(additionalUserFields).toHaveProperty("companyName");
    expect(additionalUserFields).toHaveProperty("phone");
    expect(additionalUserFields).toHaveProperty("address");
  });

  it("supports exactly the personal & business roles", () => {
    expect([...ACCOUNT_ROLES]).toEqual(["personal", "business"]);
  });
});
