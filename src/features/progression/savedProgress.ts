/** Ce qu'on sauvegarde de la progression (en local et dans Firestore) ; le reste se recalcule. */
export type SavedProgress = {
  totalSteps: number;
  streakDays: number;
  lastActiveDateISO: string;
  unlockedCheckpoints: string[];
  updatedAtISO: string;
  /** Tour de Traque en cours (1 = la première) et pas des tours déjà terminés. */
  lap: number;
  lapStartSteps: number;
  bestStreak: number;
  bestDaySteps: number;
  /** Succès débloqués : identifiant → date ISO du déblocage. */
  achievements: Record<string, string>;
  /** Duels de boss gagnés : « tour/identifiant du duel » → date ISO. */
  bossVictories: Record<string, string>;
};

const NEVER_ISO = new Date(0).toISOString();

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function toISO(value: unknown): string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : NEVER_ISO;
}

function toAchievements(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
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
    // Les sauvegardes d'avant les tours et les succès n'ont pas ces champs.
    lap: Math.max(1, toCount(data.lap)),
    lapStartSteps: toCount(data.lapStartSteps),
    bestStreak: Math.max(toCount(data.bestStreak), toCount(data.streakDays)),
    bestDaySteps: toCount(data.bestDaySteps),
    achievements: toAchievements(data.achievements),
    bossVictories: toAchievements(data.bossVictories),
  };
}

function mergeAchievements(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const merged = { ...a };
  for (const [id, dateISO] of Object.entries(b)) {
    if (!merged[id] || dateISO < merged[id]) merged[id] = dateISO;
  }
  return merged;
}

/**
 * Choisit entre la sauvegarde locale et celle du cloud.
 *
 * Le total de pas ne fait que monter : la sauvegarde qui en a le plus est la plus à jour
 * (l'autre a manqué des écritures, par exemple hors ligne). À égalité, le local l'emporte.
 * Le tour de Traque suit la sauvegarde gagnante. Les checkpoints, les succès et les records
 * sont réunis : on ne reperd jamais un checkpoint, un succès ni un record.
 */
export function pickSavedProgress(local: SavedProgress | null, cloud: SavedProgress | null): SavedProgress | null {
  if (!local) return cloud;
  if (!cloud) return local;

  const winner = cloud.totalSteps > local.totalSteps ? cloud : local;
  return {
    ...winner,
    unlockedCheckpoints: Array.from(new Set([...local.unlockedCheckpoints, ...cloud.unlockedCheckpoints])),
    bestStreak: Math.max(local.bestStreak, cloud.bestStreak),
    bestDaySteps: Math.max(local.bestDaySteps, cloud.bestDaySteps),
    achievements: mergeAchievements(local.achievements, cloud.achievements),
    bossVictories: mergeAchievements(local.bossVictories, cloud.bossVictories),
  };
}
