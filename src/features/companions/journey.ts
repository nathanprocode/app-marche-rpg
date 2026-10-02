import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import type { Companion } from "../../data/companions";

/** Même tolérance que pour les checkpoints atteints (progression et carte). */
const REACHED_TOLERANCE_KM = 0.0001;

function thresholdOf(checkpointId: string, checkpoints: BerserkCheckpoint[]): number {
  const checkpoint = checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) {
    throw new Error(`Checkpoint inconnu : ${checkpointId}`);
  }
  return checkpoint.kmThreshold;
}

/** Rencontré dès que son checkpoint est débloqué : il reste ensuite dans la collection, même s'il a quitté Guts. */
export function isCompanionMet(companion: Companion, unlockedCheckpointIds: string[]): boolean {
  return unlockedCheckpointIds.includes(companion.metAtCheckpointId);
}

/** Les compagnons qui marchent avec Guts à cette distance. */
export function getTravelingCompanions(
  totalKm: number,
  companions: Companion[],
  checkpoints: BerserkCheckpoint[],
): Companion[] {
  const km = totalKm + REACHED_TOLERANCE_KM;

  return companions.filter((companion) =>
    companion.travels.some((travel) => {
      const fromKm = thresholdOf(travel.fromCheckpointId, checkpoints);
      const untilKm = travel.untilCheckpointId ? thresholdOf(travel.untilCheckpointId, checkpoints) : Infinity;
      return km >= fromKm && km < untilKm;
    }),
  );
}

/** Écart entre Guts et le premier compagnon : laisse la place à son sprite (épée comprise). */
export const TROUPE_FIRST_GAP = 52;
/** Écart entre deux compagnons d'un même côté. */
export const TROUPE_STEP = 34;

/**
 * Décalages horizontaux (px) des compagnons autour de Guts, dans l'ordre reçu.
 * Ils alternent gauche / droite ; près d'un bord de la carte, tout le monde passe du côté qui a la place.
 *
 * @param roomLeft  place libre à gauche de Guts sur la carte (px).
 * @param roomRight place libre à droite.
 * @param halfWidth demi-largeur d'un sprite de compagnon (px).
 */
export function layoutTroupe(count: number, roomLeft: number, roomRight: number, halfWidth: number): number[] {
  const slot = (rank: number) => TROUPE_FIRST_GAP + rank * TROUPE_STEP;
  const balanced = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? -1 : 1) * slot(Math.floor(i / 2)));
  const needed = (offsets: number[]) => ({
    left: Math.max(0, ...offsets.map((x) => -x + halfWidth)),
    right: Math.max(0, ...offsets.map((x) => x + halfWidth)),
  });

  const { left, right } = needed(balanced);
  if (left <= roomLeft && right <= roomRight) return balanced;

  const oneSide = Array.from({ length: count }, (_, i) => slot(i));
  return roomRight >= roomLeft ? oneSide : oneSide.map((x) => -x);
}

/** Les compagnons rencontrés en atteignant ce checkpoint (pour l'écran « Point atteint »). */
export function getCompanionsMetAt(checkpointId: string, companions: Companion[]): Companion[] {
  return companions.filter((companion) => companion.metAtCheckpointId === checkpointId);
}
