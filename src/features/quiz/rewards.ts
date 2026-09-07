/** Mirrors the database reward rules for previews/tests; the completion RPC is authoritative. */
export function calculateQuizReward(correct: number, answered: number) {
  const wrong = Math.max(0, answered - correct);
  return { exp: correct * 10 - wrong * 5, coins: correct * 20 };
}

export function applyLevelUps(level: number, exp: number) {
  let nextLevel = level;
  let remainingExp = Math.max(0, exp);
  while (remainingExp >= 20 + nextLevel * 30) {
    remainingExp -= 20 + nextLevel * 30;
    nextLevel += 1;
  }
  return {
    level: nextLevel,
    exp: remainingExp,
    bonusCoins: (nextLevel - level) * 100,
  };
}
