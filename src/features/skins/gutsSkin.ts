import type { GutsSkin } from "../../data/gutsSkins";
import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";

/** Où en est le joueur, pour savoir quels skins il a débloqués. */
export type SkinProgress = {
  lap: number;
  /** Distance du tour en cours. */
  totalDistanceKm: number;
};

/**
 * Un skin lié à un checkpoint est débloqué dès qu'on l'a atteint une fois : dans le tour en cours,
 * ou dans un tour précédent (un tour fini, c'est toute la carte parcourue).
 */
export function isSkinUnlocked(skin: GutsSkin, progress: SkinProgress, checkpoints: BerserkCheckpoint[]): boolean {
  if (skin.unlock.type === "always") return true;
  if (progress.lap > 1) return true;
  const { checkpointId } = skin.unlock;
  const checkpoint = checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) throw new Error(`Checkpoint inconnu : ${checkpointId}`);
  return progress.totalDistanceKm >= checkpoint.kmThreshold;
}

export function unlockedSkins(skins: GutsSkin[], progress: SkinProgress, checkpoints: BerserkCheckpoint[]): GutsSkin[] {
  return skins.filter((skin) => isSkinUnlocked(skin, progress, checkpoints));
}

/**
 * Le skin porté sur la carte : celui choisi dans le Profil s'il est débloqué, sinon le dernier débloqué dans l'ordre
 * de l'histoire (Guts jeune est donc imposé avant la première Éclipse). Le choix est gardé aux tours suivants.
 */
export function resolveGutsSkin(
  skins: GutsSkin[],
  chosenId: string | null,
  progress: SkinProgress,
  checkpoints: BerserkCheckpoint[],
): GutsSkin {
  const unlocked = unlockedSkins(skins, progress, checkpoints);
  if (unlocked.length === 0) throw new Error("Aucun skin de Guts débloqué");
  return unlocked.find((skin) => skin.id === chosenId) ?? unlocked[unlocked.length - 1];
}
