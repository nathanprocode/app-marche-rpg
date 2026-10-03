/** Heures proposées pour le rappel du soir. */
export const REMINDER_HOUR_OPTIONS = [18, 19, 20, 21] as const;
export const DEFAULT_REMINDER_HOUR = 20;

/** Nombre de soirs programmés d'avance : si l'app reste fermée, le rappel revient quand même. */
export const REMINDER_DAYS_AHEAD = 3;

/**
 * Dates des prochains rappels. Le soir même n'est programmé que si l'heure n'est pas passée et
 * que l'objectif n'est pas déjà atteint ; les suivants le sont toujours (on les reprogramme à chaque ouverture).
 */
export function planReminderDates(
  now: Date,
  hour: number,
  goalReachedToday: boolean,
  count = REMINDER_DAYS_AHEAD,
): Date[] {
  const dates: Date[] = [];
  for (let offset = 0; dates.length < count && offset < count + 1; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 0, 0, 0);
    if (offset === 0 && (goalReachedToday || date.getTime() <= now.getTime())) continue;
    dates.push(date);
  }
  return dates;
}

export type ReminderContent = { title: string; body: string };

export function buildReminderContent(streakDays: number): ReminderContent {
  if (streakDays >= 2) {
    return {
      title: "🩸 La Marque saigne",
      body: `Ta série de ${streakDays} jours est en jeu. Quelques pas encore avant la nuit.`,
    };
  }
  return {
    title: "🩸 La Marque saigne",
    body: "Tu n'as pas encore atteint ton objectif du jour. Guts t'attend sur la route.",
  };
}
