import { create } from "zustand";
import { buildProgressFromSteps } from "../features/progression/engine";
import type { PlayerProgress } from "../features/progression/types";

const initialProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());

type PlayerState = {
  progress: PlayerProgress;
  setProgress: (progress: PlayerProgress) => void;
  syncFromSteps: (totalSteps: number, streakDays: number, lastActiveDateISO: string) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  progress: initialProgress,
  setProgress: (progress) => set({ progress }),
  syncFromSteps: (totalSteps, streakDays, lastActiveDateISO) =>
    set({ progress: buildProgressFromSteps(totalSteps, streakDays, lastActiveDateISO) }),
}));
