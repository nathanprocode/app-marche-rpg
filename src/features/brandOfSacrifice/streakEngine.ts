const DAY_MS = 24 * 60 * 60 * 1000;

function toUTCMidnight(dateISO: string): number {
  const date = new Date(dateISO);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function computeDayDiff(fromISO: string, toISO: string): number {
  return Math.floor((toUTCMidnight(toISO) - toUTCMidnight(fromISO)) / DAY_MS);
}

export function computeNextStreak(
  previousStreak: number,
  lastActiveDateISO: string,
  currentDateISO: string,
  stepsToday: number,
  minStepsForActiveDay: number,
): number {
  if (stepsToday < minStepsForActiveDay) return previousStreak;

  const diffDays = computeDayDiff(lastActiveDateISO, currentDateISO);

  if (diffDays <= 0) return previousStreak;
  if (diffDays === 1) return previousStreak + 1;
  return 1;
}
