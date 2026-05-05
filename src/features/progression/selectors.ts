import type { PlayerProgress } from "./types";

export function kmRemaining(progress: PlayerProgress): number {
  return Math.max(0, 1000 - progress.totalDistanceKm);
}

export function isGoalReached(progress: PlayerProgress): boolean {
  return progress.totalDistanceKm >= 1000;
}
