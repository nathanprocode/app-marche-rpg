import { GAME_CONFIG } from "../../core/constants/game";
import stages from "../../data/map/stages.json";
import type { JourneyStage, PlayerProgress, BrandState } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getStages(): JourneyStage[] {
  return stages as JourneyStage[];
}

export function resolveCurrentStage(distanceKm: number, journeyStages = getStages()): JourneyStage {
  const found = journeyStages.find((stage) => distanceKm >= stage.startKm && distanceKm < stage.endKm);
  return found ?? journeyStages[journeyStages.length - 1];
}

export function computeStageProgressPct(distanceKm: number, stage: JourneyStage): number {
  const stageSpan = Math.max(0.0001, stage.endKm - stage.startKm);
  return clamp(((distanceKm - stage.startKm) / stageSpan) * 100, 0, 100);
}

export function computeGlobalProgressPct(distanceKm: number): number {
  return clamp((distanceKm / GAME_CONFIG.totalGoalKm) * 100, 0, 100);
}

export function deriveBrandState(stepsToday: number): BrandState {
  return stepsToday >= GAME_CONFIG.sedentaryThresholdStepsPerDay ? "active" : "bleeding";
}

export function buildProgressFromSteps(
  totalSteps: number,
  streakDays: number,
  lastActiveDateISO: string,
): PlayerProgress {
  const distanceKm = (totalSteps * GAME_CONFIG.metersPerStep) / 1000;
  const currentStage = resolveCurrentStage(distanceKm);

  return {
    totalSteps,
    totalDistanceKm: distanceKm,
    progressPct: computeGlobalProgressPct(distanceKm),
    currentStageId: currentStage.id,
    currentStageProgressPct: computeStageProgressPct(distanceKm, currentStage),
    streakDays,
    brandState: deriveBrandState(totalSteps),
    lastActiveDateISO,
  };
}
