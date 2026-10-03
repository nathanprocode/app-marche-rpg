export const GAME_CONFIG = {
  totalGoalKm: 1000,
  metersPerStep: 0.75,
  sedentaryThresholdStepsPerDay: 1500,
} as const;

/** Objectifs quotidiens proposés dans le Profil ; le premier est celui par défaut. */
export const DAILY_GOAL_OPTIONS = [1500, 3000, 5000, 8000] as const;
export const DEFAULT_DAILY_GOAL: number = GAME_CONFIG.sedentaryThresholdStepsPerDay;

/** Pas à faire pour parcourir toute la Traque une fois. */
export const STEPS_PER_LAP = Math.ceil((GAME_CONFIG.totalGoalKm * 1000) / GAME_CONFIG.metersPerStep);
