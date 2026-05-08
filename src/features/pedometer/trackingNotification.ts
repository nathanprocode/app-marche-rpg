import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../mapJourney/interpolation";
import { stepsToKm } from "./service";

export type TrackingNotificationContent = {
  title: string;
  text: string;
};

function formatArcTitle(totalKm: number): string {
  const position = calculateGutsPosition(totalKm, BERSERK_CHECKPOINTS);
  const arc = position.previous.arc;
  const normalizedArc = arc.toLocaleLowerCase();
  const prefix = normalizedArc.startsWith("âge") || normalizedArc.startsWith("Ã¢ge") ? "de l'" : "de ";

  return `🌑 Arc ${prefix}${arc}`;
}

export function buildTrackingNotificationContent(stepsToday: number, totalSteps: number): TrackingNotificationContent {
  const todayKm = stepsToKm(stepsToday);
  const totalKm = stepsToKm(totalSteps);

  return {
    title: formatArcTitle(totalKm),
    text: `Aujourd'hui : ${todayKm.toFixed(2)} km | Total : ${totalKm.toFixed(2)} km`,
  };
}
