import checkpoints from "../../data/map/checkpoints.json";
import stages from "../../data/map/stages.json";
import { interpolatePoint } from "./interpolation";
import type { MapPoint, StageCheckpoint } from "./types";

function getCheckpoint(stageId: string): StageCheckpoint | undefined {
  return (checkpoints as StageCheckpoint[]).find((point) => point.stageId === stageId);
}

export function resolveAvatarPosition(currentStageId: string, currentStageProgressPct: number): MapPoint {
  const stagesList = stages as { id: string }[];
  const stageIndex = stagesList.findIndex((stage) => stage.id === currentStageId);

  const from = getCheckpoint(currentStageId) ?? { stageId: currentStageId, x: 0.05, y: 0.8 };
  const nextStage = stagesList[Math.min(stageIndex + 1, stagesList.length - 1)]?.id ?? currentStageId;
  const to = getCheckpoint(nextStage) ?? from;

  return interpolatePoint(from, to, currentStageProgressPct);
}
