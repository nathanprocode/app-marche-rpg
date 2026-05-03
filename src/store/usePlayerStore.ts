import { create } from "zustand";
import type { PlayerProgress } from "../features/progression/types";

const initialProgress: PlayerProgress = {
  totalSteps: 0,
  totalDistanceKm: 0,
  progressPct: 0,
  currentStageId: "stage-001",
  currentStageProgressPct: 0,
  streakDays: 0,
  brandState: "idle",
  lastActiveDateISO: new Date(0).toISOString(),
};

type PlayerState = {
  progress: PlayerProgress;
  setProgress: (progress: PlayerProgress) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  progress: initialProgress,
  setProgress: (progress) => set({ progress }),
}));
