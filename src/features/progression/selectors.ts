import { GAME_CONFIG } from "../../core/constants/game";
import type { PlayerProgress } from "./types";

export function kmRemaining(progress: PlayerProgress): number {
  return Math.max(0, GAME_CONFIG.totalGoalKm - progress.totalDistanceKm);
}

/** La Traque du tour en cours est terminée (1 000 km). */
export function isGoalReached(progress: PlayerProgress): boolean {
  return progress.totalDistanceKm >= GAME_CONFIG.totalGoalKm - 0.0001;
}
