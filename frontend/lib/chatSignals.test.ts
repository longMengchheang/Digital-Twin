import { expect, test, describe } from "bun:test";
import { normalizeSignalType, CHAT_SIGNAL_TYPES } from "./chatSignals";

describe("normalizeSignalType", () => {
  describe("Exact Matches", () => {
    test("should return correct signal type for exact matches", () => {
      for (const signal of CHAT_SIGNAL_TYPES) {
        expect(normalizeSignalType(signal)).toBe(signal);
      }
    });
  });

  describe("Case Insensitivity", () => {
    test("should handle mixed case inputs", () => {
      expect(normalizeSignalType("Stress")).toBe("stress");
      expect(normalizeSignalType("FOCUS")).toBe("focus");
      expect(normalizeSignalType("MoTiVaTiOn")).toBe("motivation");
    });
  });

  describe("Aliases", () => {
    test("should map aliases to correct signal type", () => {
      const aliases = {
        stressed: "stress",
        focused: "focus",
        concentration: "focus",
        motivated: "motivation",
        tired: "fatigue",
        anxious: "anxiety",
        productive: "productivity",
        confident: "confidence",
        procrastinating: "procrastination",
        mindful: "mindfulness",
        breath: "breathing",
      };

      for (const [alias, expected] of Object.entries(aliases)) {
        expect(normalizeSignalType(alias)).toBe(expected as any);
      }
    });
  });

  describe("Whitespace Handling", () => {
    test("should trim whitespace", () => {
      expect(normalizeSignalType("  stress  ")).toBe("stress");
      expect(normalizeSignalType("\tfocus\n")).toBe("focus");
    });
  });

  describe("Invalid Inputs", () => {
    test("should return null for null/undefined", () => {
      expect(normalizeSignalType(null)).toBeNull();
      expect(normalizeSignalType(undefined)).toBeNull();
    });

    test("should return null for empty strings", () => {
      expect(normalizeSignalType("")).toBeNull();
      expect(normalizeSignalType("   ")).toBeNull();
    });

    test("should return null for unknown signals", () => {
      expect(normalizeSignalType("unknown_signal")).toBeNull();
      expect(normalizeSignalType("random text")).toBeNull();
    });
  });

  describe("Non-string Inputs", () => {
    test("should handle numbers by converting to string", () => {
        // "123" is not a valid signal
      expect(normalizeSignalType(123)).toBeNull();
    });

    test("should handle objects gracefully", () => {
        expect(normalizeSignalType({})).toBeNull();
    });
  });
});
