import { describe, expect, it } from "vitest";
import {
  emptyEquipment,
  requiredExpForLevel,
  targetTypeForStage,
  todayInSeoul,
} from "@/lib/api/game";

describe("game API transforms", () => {
  it("uses the same level requirement formula as the reward RPC", () => {
    expect(requiredExpForLevel(1)).toBe(50);
    expect(requiredExpForLevel(2)).toBe(80);
  });

  it("maps egg and hatched stages to item targets", () => {
    expect(targetTypeForStage("egg")).toBe("egg");
    expect(targetTypeForStage("baby")).toBe("pet");
    expect(targetTypeForStage("adult")).toBe("pet");
  });

  it("creates all equipment slots as empty", () => {
    expect(emptyEquipment()).toEqual({
      pattern: null,
      hat: null,
      glasses: null,
      nest: null,
    });
  });

  it("calculates the service date in Asia/Seoul", () => {
    expect(todayInSeoul(new Date("2026-07-04T16:00:00.000Z"))).toBe(
      "2026-07-05"
    );
  });
});
