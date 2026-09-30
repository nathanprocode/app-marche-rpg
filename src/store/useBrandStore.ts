import { create } from "zustand";
import { deriveBrandStateFromStreak, getBrandVisualState } from "../features/brandOfSacrifice/bleedingState";
import type { DayState } from "../features/brandOfSacrifice/streakEngine";
import type { BrandStatus } from "../features/brandOfSacrifice/types";

const initialStatus: BrandStatus = {
  streakDays: 0,
  sedentaryDays: 0,
  lastActiveDateISO: new Date(0).toISOString(),
  visual: { state: "idle", intensity: 0.1 },
};

type BrandStateStore = {
  status: BrandStatus;
  /** Reçoit l'état du jour calculé par computeDayState (voir runtime/dailySync). */
  applyDayState: (day: DayState, progressPct: number) => void;
};

export const useBrandStore = create<BrandStateStore>((set) => ({
  status: initialStatus,
  applyDayState: (day, progressPct) => {
    const visual = getBrandVisualState(day.streakDays, day.sedentaryDays, progressPct);
    const state = deriveBrandStateFromStreak(day.streakDays, day.sedentaryDays);

    set({
      status: {
        streakDays: day.streakDays,
        sedentaryDays: day.sedentaryDays,
        lastActiveDateISO: day.lastActiveDateISO,
        visual: { ...visual, state },
      },
    });
  },
}));
