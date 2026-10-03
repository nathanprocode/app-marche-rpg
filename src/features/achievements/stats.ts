import { GAME_CONFIG } from "../../core/constants/game";
import { COMPANIONS } from "../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { isCompanionMet } from "../companions/journey";
import type { PlayerProgress } from "../progression/types";
import type { AchievementStats } from "./achievements";

export function buildAchievementStats(
  progress: PlayerProgress,
  unlockedCheckpoints: string[],
  bestStreak: number,
  bestDaySteps: number,
): AchievementStats {
  return {
    lifetimeKm: (progress.totalSteps * GAME_CONFIG.metersPerStep) / 1000,
    bestStreak,
    bestDaySteps,
    checkpointsUnlocked: unlockedCheckpoints.length,
    checkpointsTotal: BERSERK_CHECKPOINTS.length,
    companionsMet: COMPANIONS.filter((companion) => isCompanionMet(companion, unlockedCheckpoints)).length,
    companionsTotal: COMPANIONS.length,
    lapsCompleted: progress.lap - 1,
  };
}
