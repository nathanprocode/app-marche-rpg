import { DEFAULT_DAILY_GOAL, GAME_CONFIG } from "../../core/constants/game";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../mapJourney/interpolation";
import type { BrandState, PlayerProgress } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeGlobalProgressPct(distanceKm: number): number {
  return clamp((distanceKm / GAME_CONFIG.totalGoalKm) * 100, 0, 100);
}

/** La Marque est apaisée ("active") dès que le seuil de pas du jour est atteint, sinon elle saigne. */
export function deriveBrandState(stepsToday: number, dailyGoal = DEFAULT_DAILY_GOAL): BrandState {
  return stepsToday >= dailyGoal ? "active" : "bleeding";
}

export type ProgressOptions = {
  /** Pas des tours déjà terminés : le tour en cours repart de zéro après eux. */
  lapStartSteps?: number;
  lap?: number;
  dailyGoal?: number;
};

export function buildProgressFromSteps(
  totalSteps: number,
  streakDays: number,
  lastActiveDateISO: string,
  stepsToday = 0,
  options: ProgressOptions = {},
): PlayerProgress {
  const { lapStartSteps = 0, lap = 1, dailyGoal = DEFAULT_DAILY_GOAL } = options;
  const lapSteps = Math.max(0, totalSteps - lapStartSteps);
  const distanceKm = (lapSteps * GAME_CONFIG.metersPerStep) / 1000;
  // Un seul système de repères : les checkpoints de la Traque (berserk-checkpoints.ts).
  const position = calculateGutsPosition(distanceKm, BERSERK_CHECKPOINTS);

  return {
    totalSteps,
    lapSteps,
    lap,
    lapStartSteps,
    totalDistanceKm: distanceKm,
    progressPct: computeGlobalProgressPct(distanceKm),
    currentCheckpointId: position.previous.id,
    currentSegmentProgressPct: position.segmentProgressPct,
    streakDays,
    brandState: deriveBrandState(stepsToday, dailyGoal),
    lastActiveDateISO,
  };
}
