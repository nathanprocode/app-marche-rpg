const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Numéro de jour calendaire dans le fuseau local de l'appareil.
 * On passe par Date.UTC sur les composantes locales pour que le fuseau
 * et les changements d'heure ne décalent jamais la date.
 */
export function toLocalDayNumber(input: string | Date): number {
  const date = typeof input === "string" ? new Date(input) : input;
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function computeDayDiff(fromISO: string, toISO: string): number {
  return toLocalDayNumber(toISO) - toLocalDayNumber(fromISO);
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

export type DayState = {
  streakDays: number;
  lastActiveDateISO: string;
  /** Jours entiers écoulés sans atteindre le seuil (la journée en cours n'est pas comptée). */
  sedentaryDays: number;
  activeToday: boolean;
};

type DayStateInput = {
  streakDays: number;
  lastActiveDateISO: string;
  stepsToday: number;
  nowISO: string;
  minStepsForActiveDay: number;
};

/**
 * Calcule l'état de la série à partir de dates uniquement : on peut l'appeler
 * autant de fois qu'on veut dans la journée, le résultat ne dérive pas.
 */
export function computeDayState(input: DayStateInput): DayState {
  const { streakDays, lastActiveDateISO, stepsToday, nowISO, minStepsForActiveDay } = input;
  const activeToday = stepsToday >= minStepsForActiveDay;
  const dayDiff = computeDayDiff(lastActiveDateISO, nowISO);

  if (activeToday) {
    return {
      streakDays: computeNextStreak(streakDays, lastActiveDateISO, nowISO, stepsToday, minStepsForActiveDay),
      lastActiveDateISO: dayDiff > 0 ? nowISO : lastActiveDateISO,
      sedentaryDays: 0,
      activeToday: true,
    };
  }

  const neverActive = new Date(lastActiveDateISO).getTime() <= 0;
  return {
    streakDays,
    lastActiveDateISO,
    sedentaryDays: neverActive ? 0 : Math.max(0, dayDiff - 1),
    activeToday: false,
  };
}
