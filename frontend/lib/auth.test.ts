import { describe, test, expect, beforeAll } from "bun:test";

import { verifyToken, signToken, type DecodedUser } from "./auth";
import jwt from "jsonwebtoken";

describe("verifyToken", () => {
  const mockUser: DecodedUser = {
    id: "user123",
    email: "test@example.com",
  };

  test("should return null if authorization header is missing", () => {
    const req = new Request("http://localhost", {
      headers: {},
    });
    expect(verifyToken(req)).toBeNull();
  });

  test("should return null if authorization header does not start with Bearer", () => {
    const req = new Request("http://localhost", {
      headers: {
        authorization: "Basic somecredential",
      },
    });
    expect(verifyToken(req)).toBeNull();
  });

  test("should return null if token is missing after Bearer", () => {
    const req = new Request("http://localhost", {
      headers: {
        authorization: "Bearer ", // just whitespace
      },
    });
    expect(verifyToken(req)).toBeNull();
  });

  test("should return null if token is invalid", () => {
    const req = new Request("http://localhost", {
      headers: {
        authorization: "Bearer invalid.token.string",
      },
    });
    expect(verifyToken(req)).toBeNull();
  });

  test("should return decoded user if token is valid", () => {
    const token = signToken(mockUser);
    const req = new Request("http://localhost", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const result = verifyToken(req);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockUser.id);
    expect(result?.email).toBe(mockUser.email);
  });

  test("should return null if token is expired", () => {
    // Manually create an expired token
    // Note: The payload structure in auth.ts is { user: DecodedUser }
    const expiredToken = jwt.sign(
      { user: mockUser },
      process.env.JWT_SECRET!,
      { expiresIn: "-1s" } // expired 1 second ago
    );

    const req = new Request("http://localhost", {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    });

    expect(verifyToken(req)).toBeNull();
  });
});
