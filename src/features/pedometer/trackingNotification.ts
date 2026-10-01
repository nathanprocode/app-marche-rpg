import { formatDecimal } from "../../core/format";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../mapJourney/interpolation";
import { stepsToKm } from "./service";

export type TrackingNotificationContent = {
  title: string;
  text: string;
};

/**
 * Titre de la notification pour chaque arc. Les mêmes textes sont écrits par le service natif
 * quand l'app est fermée (PermanentPedometerService.resolveNotificationTitle) : garder les deux identiques.
 */
export const ARC_TITLES: Record<string, string> = {
  "Âge d'Or": "Arc de l'Âge d'Or",
  "Guerrier Noir": "Arc du Guerrier Noir",
  "Châtiments": "Arc des Châtiments",
  "Faucon Millénaire": "Arc du Faucon Millénaire",
  "Fantasia": "Arc Fantasia",
};

function formatArcTitle(totalKm: number): string {
  const { arc } = calculateGutsPosition(totalKm, BERSERK_CHECKPOINTS).previous;
  return `🌑 ${ARC_TITLES[arc] ?? `Arc ${arc}`}`;
}

export function buildTrackingNotificationContent(stepsToday: number, totalSteps: number): TrackingNotificationContent {
  return {
    title: formatArcTitle(stepsToKm(totalSteps)),
    text: `Aujourd'hui : ${formatDecimal(stepsToKm(stepsToday), 2)} km | Total : ${formatDecimal(stepsToKm(totalSteps), 2)} km`,
  };
}
