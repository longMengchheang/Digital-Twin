import { expect, test, describe } from "bun:test";
import { applyXPDelta, getDayKey } from "./progression";

describe("applyXPDelta", () => {
  test("should gain XP without leveling up", () => {
    const initialState = { level: 1, currentXP: 10, requiredXP: 100 };
    const result = applyXPDelta(initialState, 50);
    expect(result).toEqual({
      level: 1,
      currentXP: 60,
      requiredXP: 100,
    });
  });

  test("should level up once", () => {
    const initialState = { level: 1, currentXP: 90, requiredXP: 100 };
    const result = applyXPDelta(initialState, 20);
    // Level 1: 100 XP required.
    // 90 + 20 = 110. 110 - 100 = 10 XP remaining.
    // Level 2: required XP = 100 + (2-1)*25 = 125.
    expect(result).toEqual({
      level: 2,
      currentXP: 10,
      requiredXP: 125,
    });
  });

  test("should level up multiple times", () => {
    const initialState = { level: 1, currentXP: 0, requiredXP: 100 };
    // Level 1: 100 XP
    // Level 2: 125 XP
    // Level 3: 150 XP
    // Total for Level 4: 100 + 125 + 150 = 375 XP
    const result = applyXPDelta(initialState, 400);
    // 400 - 100 (L1) = 300
    // 300 - 125 (L2) = 175
    // 175 - 150 (L3) = 25
    // Level 4: required XP = 100 + (4-1)*25 = 175.
    expect(result).toEqual({
      level: 4,
      currentXP: 25,
      requiredXP: 175,
    });
  });

  test("should lose XP without leveling down", () => {
    const initialState = { level: 2, currentXP: 50, requiredXP: 125 };
    const result = applyXPDelta(initialState, -20);
    expect(result).toEqual({
      level: 2,
      currentXP: 30,
      requiredXP: 125,
    });
  });

  test("should level down once", () => {
    const initialState = { level: 2, currentXP: 10, requiredXP: 125 };
    const result = applyXPDelta(initialState, -20);
    // 10 - 20 = -10.
    // Level down to 1: required XP = 100.
    // -10 + 100 = 90.
    expect(result).toEqual({
      level: 1,
      currentXP: 90,
      requiredXP: 100,
    });
  });

  test("should cap at level 1, XP 0", () => {
    const initialState = { level: 1, currentXP: 10, requiredXP: 100 };
    const result = applyXPDelta(initialState, -50);
    expect(result).toEqual({
      level: 1,
      currentXP: 0,
      requiredXP: 100,
    });
  });

  test("should handle zero delta", () => {
    const initialState = { level: 1, currentXP: 50, requiredXP: 100 };
    const result = applyXPDelta(initialState, 0);
    expect(result).toEqual(initialState);
  });

  test("should floor decimal delta", () => {
    const initialState = { level: 1, currentXP: 10, requiredXP: 100 };
    const result = applyXPDelta(initialState, 10.9);
    expect(result.currentXP).toBe(20);
  });

  test("should handle partial state input", () => {
    const result = applyXPDelta({ level: 1 }, 20);
    expect(result).toEqual({
      level: 1,
      currentXP: 20,
      requiredXP: 100,
    });
  });

  test("should handle missing input", () => {
    // @ts-ignore
    const result = applyXPDelta({}, 20);
    expect(result).toEqual({
      level: 1,
      currentXP: 20,
      requiredXP: 100,
    });
  });
});

describe("getDayKey", () => {
  test("should format standard date correctly", () => {
    // October 15, 2023
    const date = new Date(2023, 9, 15);
    expect(getDayKey(date)).toBe("2023-10-15");
  });

  test("should pad single-digit months and days", () => {
    // January 5, 2023
    const date = new Date(2023, 0, 5);
    expect(getDayKey(date)).toBe("2023-01-05");
  });

  test("should handle leap years (Feb 29)", () => {
    // February 29, 2024
    const date = new Date(2024, 1, 29);
    expect(getDayKey(date)).toBe("2024-02-29");
  });

  test("should handle end of year", () => {
    // December 31, 2023
    const date = new Date(2023, 11, 31);
    expect(getDayKey(date)).toBe("2023-12-31");
  });
});
