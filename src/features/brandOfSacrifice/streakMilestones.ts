/** Les paliers de série visés, en jours d'affilée. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/** Le prochain palier à atteindre, ou null une fois le dernier dépassé. */
export function nextStreakMilestone(streakDays: number): number | null {
  return STREAK_MILESTONES.find((milestone) => milestone > streakDays) ?? null;
}
