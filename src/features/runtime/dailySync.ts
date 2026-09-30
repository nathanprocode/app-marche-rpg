import { GAME_CONFIG } from "../../core/constants/game";
import { computeDayState } from "../brandOfSacrifice/streakEngine";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

/**
 * Met à jour la série et l'état de la Marque à partir des pas du jour.
 *
 * - Le total de pas n'est jamais modifié ici : il n'augmente que par les
 *   nouveaux pas mesurés (usePedometer). Seuls la série et la date de dernière
 *   activité sont mis à jour, et sauvegardés uniquement s'ils ont changé.
 * - Sans risque à appeler souvent : le calcul ne dépend que des dates.
 */
export async function runDailySync(nowISO = new Date().toISOString()): Promise<void> {
  const { stepsToday } = usePedometerStore.getState();
  const { progress, syncFromSteps } = usePlayerStore.getState();

  const day = computeDayState({
    streakDays: progress.streakDays,
    lastActiveDateISO: progress.lastActiveDateISO,
    stepsToday,
    nowISO,
    minStepsForActiveDay: GAME_CONFIG.sedentaryThresholdStepsPerDay,
  });

  const hasChanged =
    day.streakDays !== progress.streakDays || day.lastActiveDateISO !== progress.lastActiveDateISO;

  if (hasChanged) {
    await syncFromSteps(progress.totalSteps, day.streakDays, day.lastActiveDateISO);
  }

  const freshProgress = usePlayerStore.getState().progress;
  useBrandStore.getState().applyDayState(day, freshProgress.progressPct);
}
