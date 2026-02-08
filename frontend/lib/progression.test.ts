import { expect, test, describe } from "bun:test";
import { applyXPDelta, deriveBadges, type BadgeContext } from "./progression";

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

describe("deriveBadges", () => {
  const baseContext: BadgeContext = {
    totalQuests: 0,
    completedQuests: 0,
    checkInCount: 0,
    streak: 0,
    level: 1,
    hasEarlyCheckIn: false,
    existingBadges: [],
  };

  test("should return empty array for initial state", () => {
    const context: BadgeContext = { ...baseContext };
    const badges = deriveBadges(context);
    expect(badges).toEqual([]);
  });

  test("should earn 'First Quest' badge", () => {
    const context: BadgeContext = { ...baseContext, totalQuests: 1 };
    const badges = deriveBadges(context);
    expect(badges).toContain("First Quest");
  });

  test("should earn 'Week Warrior' badge", () => {
    const context: BadgeContext = { ...baseContext, completedQuests: 7 };
    const badges = deriveBadges(context);
    expect(badges).toContain("Week Warrior");
  });

  test("should earn 'Level 10' badge", () => {
    const context: BadgeContext = { ...baseContext, level: 10 };
    const badges = deriveBadges(context);
    expect(badges).toContain("Level 10");
  });

  test("should earn 'Streak Master' badge", () => {
    const context: BadgeContext = { ...baseContext, streak: 30 };
    const badges = deriveBadges(context);
    expect(badges).toContain("Streak Master");
  });

  test("should earn 'Mindful' badge", () => {
    const context: BadgeContext = { ...baseContext, checkInCount: 10 };
    const badges = deriveBadges(context);
    expect(badges).toContain("Mindful");
  });

  test("should earn 'Early Bird' badge", () => {
    const context: BadgeContext = { ...baseContext, hasEarlyCheckIn: true };
    const badges = deriveBadges(context);
    expect(badges).toContain("Early Bird");
  });

  test("should earn multiple badges simultaneously", () => {
    const context: BadgeContext = {
      ...baseContext,
      totalQuests: 1,
      completedQuests: 7,
      level: 10,
    };
    const badges = deriveBadges(context);
    expect(badges).toContain("First Quest");
    expect(badges).toContain("Week Warrior");
    expect(badges).toContain("Level 10");
    expect(badges.length).toBe(3);
  });

  test("should preserve existing badges", () => {
    const context: BadgeContext = {
      ...baseContext,
      existingBadges: ["Old Badge"],
      totalQuests: 1,
    };
    const badges = deriveBadges(context);
    expect(badges).toContain("Old Badge");
    expect(badges).toContain("First Quest");
  });

  test("should not duplicate existing badges", () => {
    const context: BadgeContext = {
      ...baseContext,
      existingBadges: ["First Quest"],
      totalQuests: 1,
    };
    const badges = deriveBadges(context);
    expect(badges).toContain("First Quest");
    expect(badges.filter((b) => b === "First Quest").length).toBe(1);
  });
});
