export type BrandState = "idle" | "active" | "bleeding";

export type PlayerProgress = {
  totalSteps: number;
  totalDistanceKm: number;
  progressPct: number;
  currentStageId: string;
  currentStageProgressPct: number;
  streakDays: number;
  brandState: BrandState;
  lastActiveDateISO: string;
};
