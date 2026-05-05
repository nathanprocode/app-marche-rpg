import { create } from "zustand";
import { buildProgressFromSteps } from "../features/progression/engine";
import { saveProgressionToCloud } from "../features/userCloud/service";
import type { PlayerProgress } from "../features/progression/types";
import { useAuthStore } from "./useAuthStore";
import { useBrandStore } from "./useBrandStore";

const initialProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());

type PlayerState = {
  progress: PlayerProgress;
  setProgress: (progress: PlayerProgress) => void;
  syncFromSteps: (totalSteps: number, streakDays: number, lastActiveDateISO: string) => void;
  addDevSteps: (stepsToAdd?: number) => Promise<void>;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progress: initialProgress,
  setProgress: (progress) => set({ progress }),
  syncFromSteps: (totalSteps, streakDays, lastActiveDateISO) =>
    set({ progress: buildProgressFromSteps(totalSteps, streakDays, lastActiveDateISO) }),
  addDevSteps: async (stepsToAdd = 500) => {
    const current = get().progress;
    const updated = buildProgressFromSteps(
      current.totalSteps + stepsToAdd,
      current.streakDays,
      current.lastActiveDateISO,
    );

    set({ progress: updated });

    const uid = useAuthStore.getState().userId;
    const brandIntensity = useBrandStore.getState().status.visual.intensity;
    if (uid) {
      await saveProgressionToCloud(uid, updated, brandIntensity);
      console.log("🔥 [PLAYER STORE] saveProgressionToCloud synced", {
        uid,
        totalSteps: updated.totalSteps,
        totalDistanceKm: updated.totalDistanceKm,
        currentStageProgressPct: updated.currentStageProgressPct,
      });
    } else {
      console.log("🔥 [PLAYER STORE] skipped cloud sync (no uid)");
    }
  },
}));
