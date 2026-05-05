import { create } from "zustand";
import { GAME_CONFIG } from "../core/constants/game";
import { deriveBrandStateFromStreak, getBrandVisualState } from "../features/brandOfSacrifice/bleedingState";
import { computeDayDiff, computeNextStreak } from "../features/brandOfSacrifice/streakEngine";
import type { BrandStatus } from "../features/brandOfSacrifice/types";

const initialISO = new Date(0).toISOString();

const initialStatus: BrandStatus = {
  streakDays: 0,
  sedentaryDays: 0,
  lastActiveDateISO: initialISO,
  visual: { state: "idle", intensity: 0.1 },
};

type BrandStateStore = {
  status: BrandStatus;
  syncDay: (stepsToday: number, currentDateISO: string, progressPct: number) => void;
};

export const useBrandStore = create<BrandStateStore>((set, get) => ({
  status: initialStatus,
  syncDay: (stepsToday, currentDateISO, progressPct) => {
    const current = get().status;
    const dayDiff = computeDayDiff(current.lastActiveDateISO, currentDateISO);
    const activeToday = stepsToday >= GAME_CONFIG.sedentaryThresholdStepsPerDay;

    const streakDays = computeNextStreak(
      current.streakDays,
      current.lastActiveDateISO,
      currentDateISO,
      stepsToday,
      GAME_CONFIG.sedentaryThresholdStepsPerDay,
    );

    const sedentaryDays = activeToday ? 0 : Math.max(current.sedentaryDays + Math.max(dayDiff, 1), 1);
    const visual = getBrandVisualState(streakDays, sedentaryDays, progressPct);
    const state = deriveBrandStateFromStreak(streakDays, sedentaryDays);

    set({
      status: {
        streakDays,
        sedentaryDays,
        lastActiveDateISO: activeToday ? currentDateISO : current.lastActiveDateISO,
        visual: { ...visual, state },
      },
    });
  },
}));
