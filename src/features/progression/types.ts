export type BrandState = "idle" | "active" | "bleeding";

export type PlayerProgress = {
  totalSteps: number;
  totalDistanceKm: number;
  progressPct: number;
  /** Dernier checkpoint franchi. */
  currentCheckpointId: string;
  /** Avancement (0-100) entre ce checkpoint et le suivant. */
  currentSegmentProgressPct: number;
  streakDays: number;
  brandState: BrandState;
  lastActiveDateISO: string;
};
