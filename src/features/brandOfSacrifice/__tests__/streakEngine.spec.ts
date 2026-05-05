import { computeDayDiff, computeNextStreak } from "../streakEngine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function testStreakEngine(): void {
  const d = computeDayDiff("2026-05-01T10:00:00.000Z", "2026-05-03T10:00:00.000Z");
  assert(d === 2, "day diff should be 2");

  const streak = computeNextStreak(4, "2026-05-02T00:00:00.000Z", "2026-05-03T00:00:00.000Z", 2000, 1500);
  assert(streak === 5, "streak should increment for consecutive active day");
}
