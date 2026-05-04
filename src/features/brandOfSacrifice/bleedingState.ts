import type { BrandState, BrandVisualState } from "./types";

export function deriveBrandStateFromStreak(streakDays: number, sedentaryDays: number): BrandState {
  if (sedentaryDays >= 2) return "bleeding";
  if (streakDays >= 1) return "active";
  return "idle";
}

export function getBrandVisualState(
  streakDays: number,
  sedentaryDays: number,
  progressPct: number,
): BrandVisualState {
  const state = deriveBrandStateFromStreak(streakDays, sedentaryDays);

  if (state === "bleeding") {
    return { state, intensity: Math.min(1, 0.5 + sedentaryDays * 0.2) };
  }

  if (state === "active") {
    return { state, intensity: Math.min(1, 0.2 + streakDays / 14) };
  }

  return { state, intensity: Math.max(0.1, progressPct / 100) };
}
