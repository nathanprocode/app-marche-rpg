import type { ImageSourcePropType } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import type { Achievement } from "../achievements/achievements";
import { buildAchievementShare, buildCheckpointShare, buildFinaleShare, buildProgressShare, type ProgressShareInput } from "./shareMessages";

export type ShareStat = { label: string; value: string };

/** Ce que dessine la carte à partager, plus le texte de repli quand l'image ne peut pas être envoyée. */
export type ShareCardData = {
  kicker: string;
  title: string;
  subtitle?: string;
  /** Planche du manga ou autre illustration, affichée sous le titre. */
  image?: ImageSourcePropType;
  stats: ShareStat[];
  text: string;
};

function days(count: number): string {
  return `${formatInt(count)} ${count > 1 ? "jours" : "jour"}`;
}

function lapKicker(prefix: string, lap: number): string {
  return lap > 1 ? `${prefix} · tour ${lap}` : prefix;
}

export type CardProgress = {
  totalSteps: number;
  bestStreak: number;
  lap: number;
};

export function buildCheckpointCard(
  checkpoint: BerserkCheckpoint,
  progress: CardProgress,
  image?: ImageSourcePropType,
): ShareCardData {
  return {
    kicker: lapKicker(checkpoint.arc, progress.lap),
    title: checkpoint.title,
    subtitle: `Point franchi · ${formatInt(checkpoint.kmThreshold)} km`,
    image,
    stats: [
      { label: "Pas au total", value: formatInt(progress.totalSteps) },
      { label: "Meilleure série", value: days(progress.bestStreak) },
    ],
    text: buildCheckpointShare(checkpoint, progress.lap),
  };
}

export function buildAchievementCard(achievement: Achievement, progress: CardProgress): ShareCardData {
  return {
    kicker: "Succès débloqué",
    title: achievement.title,
    subtitle: achievement.description,
    stats: [
      { label: "Pas au total", value: formatInt(progress.totalSteps) },
      { label: "Meilleure série", value: days(progress.bestStreak) },
    ],
    text: buildAchievementShare(achievement),
  };
}

export function buildFinaleCard(arrival: BerserkCheckpoint, progress: CardProgress, image?: ImageSourcePropType): ShareCardData {
  return {
    kicker: lapKicker("1 000 km", progress.lap),
    title: "La Traque est achevée",
    subtitle: arrival.title,
    image,
    stats: [
      { label: "Pas au total", value: formatInt(progress.totalSteps) },
      { label: "Meilleure série", value: days(progress.bestStreak) },
    ],
    text: buildFinaleShare(progress.totalSteps, progress.bestStreak, progress.lap),
  };
}

export function buildProgressCard(input: ProgressShareInput): ShareCardData {
  return {
    kicker: lapKicker(input.arc, input.lap),
    title: `${formatDecimal(input.totalKm)} km`,
    subtitle: "parcourus sur la Traque",
    stats: [
      { label: "Pas au total", value: formatInt(input.totalSteps) },
      { label: input.streakDays > 0 ? "Série en cours" : "Meilleure série", value: days(input.streakDays > 0 ? input.streakDays : input.bestStreak) },
    ],
    text: buildProgressShare(input),
  };
}
