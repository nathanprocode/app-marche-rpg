import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { runDailySync } from "./dailySync";

/**
 * Remet tout à zéro : progression, série, records, succès, tour de Traque, pas du jour et historique.
 * La sauvegarde cloud est écrasée tout de suite (sinon, au prochain démarrage, le cloud l'emporterait).
 * Les réglages (objectif, rappel, suivi permanent) sont conservés.
 */
export async function eraseAllProgress(): Promise<void> {
  await usePedometerStore.getState().clearAllSteps();
  await usePlayerStore.getState().resetProgressionDev();
  await runDailySync();
}
