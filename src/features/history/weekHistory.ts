import { GAME_CONFIG } from "../../core/constants/game";

/** Pas par jour, indexés par jour local « AAAA-MM-JJ ». */
export type StepsHistory = Record<string, number>;

export type HistoryDay = {
  dayKey: string;
  steps: number;
  km: number;
  /** Abréviation du jour de la semaine : « lun. », « mar. »… */
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
};

export type WeekSummary = {
  totalKm: number;
  /** Jour le plus marché (null si aucun pas sur la période). */
  bestDay: HistoryDay | null;
  /** Jours où le seuil de la Marque a été atteint. */
  calmDays: number;
};

/** Nombre de jours conservés dans l'historique local. */
export const HISTORY_KEEP_DAYS = 60;

// Écrites en dur : l'Intl de Hermes (moteur JS du téléphone) ne garantit pas les noms français.
const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export function toDayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Jour décalé de `days` jours (négatif pour remonter), en heure locale. */
export function shiftDay(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Les `count` derniers jours, du plus ancien à aujourd'hui ; un jour sans donnée compte 0 pas. */
export function lastDays(history: StepsHistory, today: Date, count = 7): HistoryDay[] {
  const todayKey = toDayKey(today);

  return Array.from({ length: count }, (_, i) => {
    const date = shiftDay(today, i - count + 1);
    const dayKey = toDayKey(date);
    const steps = history[dayKey] ?? 0;
    return {
      dayKey,
      steps,
      km: (steps * GAME_CONFIG.metersPerStep) / 1000,
      weekday: WEEKDAYS[date.getDay()],
      dayOfMonth: date.getDate(),
      isToday: dayKey === todayKey,
    };
  });
}

export function summarizeDays(days: HistoryDay[], thresholdSteps = GAME_CONFIG.sedentaryThresholdStepsPerDay): WeekSummary {
  const bestDay = days.reduce<HistoryDay | null>((best, day) => (day.steps > (best?.steps ?? 0) ? day : best), null);

  return {
    totalKm: days.reduce((sum, day) => sum + day.km, 0),
    bestDay,
    calmDays: days.filter((day) => day.steps >= thresholdSteps).length,
  };
}

/** Garde les HISTORY_KEEP_DAYS derniers jours (aujourd'hui compris) ; les plus anciens sont oubliés. */
export function pruneHistory(history: StepsHistory, today: Date): StepsHistory {
  const oldestKept = toDayKey(shiftDay(today, -(HISTORY_KEEP_DAYS - 1)));
  return Object.fromEntries(Object.entries(history).filter(([dayKey]) => dayKey >= oldestKept));
}
