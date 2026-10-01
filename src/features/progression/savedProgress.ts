/** Ce qu'on sauvegarde de la progression (en local et dans Firestore) ; le reste se recalcule. */
export type SavedProgress = {
  totalSteps: number;
  streakDays: number;
  lastActiveDateISO: string;
  unlockedCheckpoints: string[];
  updatedAtISO: string;
};

const NEVER_ISO = new Date(0).toISOString();

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function toISO(value: unknown): string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : NEVER_ISO;
}

/** Relit une sauvegarde dont on ne connaît pas la forme (ancienne version, JSON abîmé). */
export function parseSavedProgress(raw: unknown): SavedProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  return {
    totalSteps: toCount(data.totalSteps),
    streakDays: toCount(data.streakDays),
    lastActiveDateISO: toISO(data.lastActiveDateISO),
    unlockedCheckpoints: Array.isArray(data.unlockedCheckpoints)
      ? data.unlockedCheckpoints.filter((id): id is string => typeof id === "string")
      : [],
    updatedAtISO: toISO(data.updatedAtISO),
  };
}

/**
 * Choisit entre la sauvegarde locale et celle du cloud.
 *
 * Le total de pas ne fait que monter : la sauvegarde qui en a le plus est la plus à jour
 * (l'autre a manqué des écritures, par exemple hors ligne). À égalité, le local l'emporte.
 * Les checkpoints débloqués sont réunis : on ne reperd jamais un checkpoint.
 */
export function pickSavedProgress(local: SavedProgress | null, cloud: SavedProgress | null): SavedProgress | null {
  if (!local) return cloud;
  if (!cloud) return local;

  const winner = cloud.totalSteps > local.totalSteps ? cloud : local;
  return {
    ...winner,
    unlockedCheckpoints: Array.from(new Set([...local.unlockedCheckpoints, ...cloud.unlockedCheckpoints])),
  };
}
