import { formatDecimal, formatInt } from "../../core/format";
import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import type { Achievement } from "../achievements/achievements";

const APP_NAME = "Marche du Faucon";

function lapSuffix(lap: number): string {
  return lap > 1 ? ` (tour ${lap})` : "";
}

export function buildCheckpointShare(checkpoint: BerserkCheckpoint, lap: number): string {
  return `🩸 « ${checkpoint.title} » : ${formatInt(checkpoint.kmThreshold)} km de la Traque parcourus à pied${lapSuffix(lap)}.\n— ${APP_NAME}`;
}

export function buildAchievementShare(achievement: Achievement): string {
  return `🏆 Succès « ${achievement.title} » : ${achievement.description}\n— ${APP_NAME}`;
}

export type ProgressShareInput = {
  totalKm: number;
  lap: number;
  streakDays: number;
  bestStreak: number;
  totalSteps: number;
  arc: string;
};

export function buildProgressShare({ totalKm, lap, streakDays, bestStreak, totalSteps, arc }: ProgressShareInput): string {
  const streak = streakDays > 0 ? `Série en cours : ${streakDays} ${streakDays > 1 ? "jours" : "jour"} (record : ${bestStreak}).` : `Record de série : ${bestStreak}.`;
  return `🩸 ${formatDecimal(totalKm)} km sur la Traque${lapSuffix(lap)}, arc ${arc}. ${streak} ${formatInt(totalSteps)} pas au total.\n— ${APP_NAME}`;
}

export function buildFinaleShare(totalSteps: number, bestStreak: number, lap: number): string {
  return `⚔️ La Traque est achevée${lapSuffix(lap)} : 1 000 km à pied, ${formatInt(totalSteps)} pas, série record de ${bestStreak} ${bestStreak > 1 ? "jours" : "jour"}.\n— ${APP_NAME}`;
}
