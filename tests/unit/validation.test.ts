import { describe, expect, it } from "vitest";
import {
  dateSchema,
  equipmentSlotSchema,
  monthRange,
  nicknameSchema,
  positiveIdSchema,
  yearMonthSchema,
} from "@/lib/api/validation";

describe("API validation", () => {
  it("parses positive integer identifiers", () => {
    expect(positiveIdSchema.parse("42")).toBe(42);
    expect(positiveIdSchema.safeParse("0").success).toBe(false);
    expect(positiveIdSchema.safeParse("1.5").success).toBe(false);
    expect(positiveIdSchema.safeParse("abc").success).toBe(false);
  });

  it("trims and validates nicknames", () => {
    expect(nicknameSchema.parse("  펫집사  ")).toBe("펫집사");
    expect(nicknameSchema.safeParse("   ").success).toBe(false);
    expect(nicknameSchema.safeParse("가".repeat(21)).success).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(dateSchema.parse("2026-07-05")).toBe("2026-07-05");
    expect(dateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(dateSchema.safeParse("2026-7-5").success).toBe(false);
  });

  it("validates year, month and equipment slots", () => {
    expect(yearMonthSchema.parse({ year: "2026", month: "7" })).toEqual({
      year: 2026,
      month: 7,
    });
    expect(yearMonthSchema.safeParse({ year: 2026, month: 13 }).success).toBe(
      false
    );
    expect(equipmentSlotSchema.safeParse("hat").success).toBe(true);
    expect(equipmentSlotSchema.safeParse("shoes").success).toBe(false);
  });

  it("builds an exclusive month range without timezone conversion", () => {
    expect(monthRange(2026, 7)).toEqual({
      start: "2026-07-01",
      endExclusive: "2026-08-01",
    });
    expect(monthRange(2026, 12)).toEqual({
      start: "2026-12-01",
      endExclusive: "2027-01-01",
    });
  });
});
