import { describe, expect, it } from "vitest";
import { applyLevelUps, calculateQuizReward } from "@/features/quiz/rewards";

describe("server reward rule mirror", () => {
  it("calculates quiz EXP and base coins", () => {
    expect(calculateQuizReward(4, 5)).toEqual({ exp: 35, coins: 80 });
  });

  it("calculates one and multiple level ups with bonuses", () => {
    expect(applyLevelUps(1, 50)).toEqual({ level: 2, exp: 0, bonusCoins: 100 });
    expect(applyLevelUps(1, 140)).toEqual({ level: 3, exp: 10, bonusCoins: 200 });
  });

  it("does not allow negative carried EXP", () => {
    expect(applyLevelUps(2, -5)).toEqual({ level: 2, exp: 0, bonusCoins: 0 });
  });
});
