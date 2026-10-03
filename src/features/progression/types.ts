export type BrandState = "idle" | "active" | "bleeding";

export type PlayerProgress = {
  /** Pas depuis le tout premier jour, tours de Traque compris. */
  totalSteps: number;
  /** Pas du tour en cours : `totalSteps` moins ceux des tours terminés. */
  lapSteps: number;
  /** Numéro du tour de Traque en cours (1 = la première Traque). */
  lap: number;
  /** Pas déjà comptés quand le tour en cours a commencé. */
  lapStartSteps: number;
  /** Distance du tour en cours : c'est elle qui place Guts sur la carte. */
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
