import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

/**
 * Bridge runtime entre podomètre, progression et marque.
 */
export async function runDailySync(currentDateISO = new Date().toISOString()): Promise<void> {
  const pedometer = usePedometerStore.getState();
  await pedometer.syncSteps();

  const pedometerState = usePedometerStore.getState();
  const playerState = usePlayerStore.getState();
  await playerState.syncFromSteps(
    pedometerState.stepsToday,
    playerState.progress.streakDays,
    playerState.progress.lastActiveDateISO,
  );

  const freshProgress = usePlayerStore.getState().progress;
  useBrandStore.getState().syncDay(pedometerState.stepsToday, currentDateISO, freshProgress.progressPct);
}
