import type { MapPoint } from "./types";

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function interpolatePoint(from: MapPoint, to: MapPoint, progressPct: number): MapPoint {
  const t = Math.min(1, Math.max(0, progressPct / 100));
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
}
