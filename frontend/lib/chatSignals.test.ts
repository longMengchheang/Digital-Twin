import { expect, test, describe } from "bun:test";
import { normalizeSignalType, CHAT_SIGNAL_TYPES, sanitizeExtractedSignals } from "./chatSignals";

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

describe("sanitizeExtractedSignals", () => {
  describe("Basic Valid Input", () => {
    test("should extract valid signals from array", () => {
      const input = [
        { signalType: "stress", intensity: 4, confidence: 0.8 },
        { signalType: "focus", intensity: 3, confidence: 0.9 },
      ];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ signalType: "stress", intensity: 4, confidence: 0.8 });
      expect(result).toContainEqual({ signalType: "focus", intensity: 3, confidence: 0.9 });
    });
  });

  describe("Input Normalization", () => {
    test("should normalize signal types, aliases and mixed case", () => {
      const input = [
        { signalType: "Stressed", intensity: 4, confidence: 0.8 },
        { signal_type: "concentration", intensity: 3, confidence: 0.9 },
        { type: "TIRED", intensity: 2, confidence: 0.6 },
      ];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ signalType: "stress", intensity: 4, confidence: 0.8 });
      expect(result).toContainEqual({ signalType: "focus", intensity: 3, confidence: 0.9 });
      expect(result).toContainEqual({ signalType: "fatigue", intensity: 2, confidence: 0.6 });
    });

    test("should handle string numbers for intensity and confidence", () => {
      const input = [{ signalType: "stress", intensity: "4", confidence: "0.8" }];
      const result = sanitizeExtractedSignals(input);
      expect(result).toContainEqual({ signalType: "stress", intensity: 4, confidence: 0.8 });
    });
  });

  describe("Defaults and Clamping", () => {
    test("should use defaults for missing values", () => {
      const input = [{ signalType: "stress" }];
      const result = sanitizeExtractedSignals(input);
      expect(result[0]).toEqual({ signalType: "stress", intensity: 3, confidence: 0.7 });
    });

    test("should clamp intensity between 1 and 5", () => {
      const input = [
        { signalType: "stress", intensity: 0 },
        { signalType: "focus", intensity: 10 },
      ];
      const result = sanitizeExtractedSignals(input);
      const stress = result.find((s) => s.signalType === "stress");
      const focus = result.find((s) => s.signalType === "focus");
      expect(stress?.intensity).toBe(1);
      expect(focus?.intensity).toBe(5);
    });

    test("should clamp confidence between 0 and 1", () => {
      const input = [
        { signalType: "stress", confidence: -0.5 },
        { signalType: "focus", confidence: 1.5 },
      ];
      const result = sanitizeExtractedSignals(input);
      const stress = result.find((s) => s.signalType === "stress");
      const focus = result.find((s) => s.signalType === "focus");
      expect(stress?.confidence).toBe(0);
      expect(focus?.confidence).toBe(1);
    });
  });

  describe("Wrapper Object Support", () => {
    test("should extract from 'signals' property", () => {
      const input = { signals: [{ signalType: "stress", intensity: 4 }] };
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0].signalType).toBe("stress");
    });

    test("should extract from 'data' property", () => {
      const input = { data: [{ signalType: "stress", intensity: 4 }] };
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0].signalType).toBe("stress");
    });
  });

  describe("Deduplication", () => {
    test("should keep signal with higher confidence", () => {
      const input = [
        { signalType: "stress", intensity: 3, confidence: 0.5 },
        { signalType: "stress", intensity: 4, confidence: 0.8 },
      ];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ signalType: "stress", intensity: 4, confidence: 0.8 });
    });

    test("should keep signal with higher intensity if confidence is equal", () => {
      const input = [
        { signalType: "stress", intensity: 3, confidence: 0.8 },
        { signalType: "stress", intensity: 5, confidence: 0.8 },
      ];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ signalType: "stress", intensity: 5, confidence: 0.8 });
    });

    test("should handle mixed order updates", () => {
      // High confidence first, then lower confidence
      const input = [
        { signalType: "stress", intensity: 4, confidence: 0.9 },
        { signalType: "stress", intensity: 3, confidence: 0.5 },
      ];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ signalType: "stress", intensity: 4, confidence: 0.9 });
    });
  });

  describe("Edge Cases/Invalid Input", () => {
    test("should return empty array for null/undefined", () => {
      expect(sanitizeExtractedSignals(null)).toEqual([]);
      expect(sanitizeExtractedSignals(undefined)).toEqual([]);
    });

    test("should return empty array for empty object", () => {
      expect(sanitizeExtractedSignals({})).toEqual([]);
    });

    test("should ignore invalid items in array", () => {
      const input = [null, "invalid", { invalid: "object" }, { signalType: "stress", intensity: 4, confidence: 0.8 }];
      const result = sanitizeExtractedSignals(input);
      expect(result).toHaveLength(1);
      expect(result[0].signalType).toBe("stress");
    });
  });
});
