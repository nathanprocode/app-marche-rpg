import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";

export type GutsPositionResult = {
  x: number;
  y: number;
  previous: BerserkCheckpoint;
  next: BerserkCheckpoint;
  segmentProgressPct: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function calculateGutsPosition(totalKm: number, checkpoints: BerserkCheckpoint[]): GutsPositionResult {
  if (checkpoints.length < 2) {
    throw new Error("At least 2 checkpoints are required for interpolation.");
  }

  const sorted = [...checkpoints].sort((a, b) => a.kmThreshold - b.kmThreshold);

  if (totalKm <= sorted[0].kmThreshold) {
    return { x: sorted[0].x, y: sorted[0].y, previous: sorted[0], next: sorted[1], segmentProgressPct: 0 };
  }

  if (totalKm >= sorted[sorted.length - 1].kmThreshold) {
    const last = sorted[sorted.length - 1];
    const beforeLast = sorted[sorted.length - 2];
    return { x: last.x, y: last.y, previous: beforeLast, next: last, segmentProgressPct: 100 };
  }

  let previous = sorted[0];
  let next = sorted[1];

  for (let i = 1; i < sorted.length; i += 1) {
    if (totalKm < sorted[i].kmThreshold) {
      previous = sorted[i - 1];
      next = sorted[i];
      break;
    }
  }

  const segmentSpan = Math.max(0.0001, next.kmThreshold - previous.kmThreshold);
  const rawT = (totalKm - previous.kmThreshold) / segmentSpan;
  const t = Math.max(0, Math.min(1, rawT));

  return {
    x: lerp(previous.x, next.x, t),
    y: lerp(previous.y, next.y, t),
    previous,
    next,
    segmentProgressPct: t * 100,
  };
}
