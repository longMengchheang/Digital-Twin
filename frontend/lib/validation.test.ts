import { expect, test, describe } from "bun:test";
import { validatePassword, validateEmail } from "./validation";

describe("validatePassword", () => {
  test("should reject short passwords", () => {
    const result = validatePassword("Short1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Password must be at least 8 characters long.");
  });

  test("should reject passwords without lowercase", () => {
    const result = validatePassword("ALLUPPER1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Password must contain at least one lowercase letter.");
  });

  test("should reject passwords without uppercase", () => {
    const result = validatePassword("alllower1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Password must contain at least one uppercase letter.");
  });

  test("should reject passwords without numbers", () => {
    const result = validatePassword("NoNumber!");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Password must contain at least one number.");
  });

  test("should reject passwords without special characters", () => {
    const result = validatePassword("NoSpecial1");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Password must contain at least one special character.");
  });

  test("should accept valid passwords", () => {
    const result = validatePassword("Valid123!");
    expect(result.isValid).toBe(true);
  });

  test("should accept valid passwords with spaces as special characters", () => {
    const result = validatePassword("Space is special 1A");
    expect(result.isValid).toBe(true);
  });
});

describe("validateEmail", () => {
  test("should accept valid emails", () => {
    expect(validateEmail("test@example.com").isValid).toBe(true);
    expect(validateEmail("user.name@domain.co.uk").isValid).toBe(true);
    expect(validateEmail("user+tag@domain.com").isValid).toBe(true);
  });

  test("should reject invalid emails", () => {
    expect(validateEmail("invalid-email").isValid).toBe(false);
    expect(validateEmail("user@domain").isValid).toBe(false);
    expect(validateEmail("@domain.com").isValid).toBe(false);
    expect(validateEmail("user@.com").isValid).toBe(false);
    expect(validateEmail("user@domain.").isValid).toBe(false);
    expect(validateEmail("").isValid).toBe(false);
  });
});
