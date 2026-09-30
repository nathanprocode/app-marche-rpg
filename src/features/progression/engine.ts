import { GAME_CONFIG } from "../../core/constants/game";
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
export function deriveBrandState(stepsToday: number): BrandState {
  return stepsToday >= GAME_CONFIG.sedentaryThresholdStepsPerDay ? "active" : "bleeding";
}

export function buildProgressFromSteps(
  totalSteps: number,
  streakDays: number,
  lastActiveDateISO: string,
  stepsToday = 0,
): PlayerProgress {
  const distanceKm = (totalSteps * GAME_CONFIG.metersPerStep) / 1000;
  // Un seul système de repères : les checkpoints de la Traque (berserk-checkpoints.ts).
  const position = calculateGutsPosition(distanceKm, BERSERK_CHECKPOINTS);

  return {
    totalSteps,
    totalDistanceKm: distanceKm,
    progressPct: computeGlobalProgressPct(distanceKm),
    currentCheckpointId: position.previous.id,
    currentSegmentProgressPct: position.segmentProgressPct,
    streakDays,
    brandState: deriveBrandState(stepsToday),
    lastActiveDateISO,
  };
}
