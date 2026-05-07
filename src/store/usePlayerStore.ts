import { create } from "zustand";
import { GAME_CONFIG } from "../core/constants/game";
import { BERSERK_CHECKPOINTS } from "../data/map/berserk-checkpoints";
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
  advanceToNextCheckpointDev: () => Promise<void>;
  resetProgressionDev: () => Promise<void>;
};

function stepsForKm(km: number): number {
  return Math.ceil((km * 1000) / GAME_CONFIG.metersPerStep);
}

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
  advanceToNextCheckpointDev: async () => {
    const current = get().progress;
    const nextCheckpoint = BERSERK_CHECKPOINTS.find(
      (checkpoint) => checkpoint.kmThreshold > current.totalDistanceKm + 0.0001,
    );

    if (!nextCheckpoint) {
      return;
    }

    const updated = buildProgressFromSteps(
      stepsForKm(nextCheckpoint.kmThreshold),
      current.streakDays,
      current.lastActiveDateISO,
    );

    set({ progress: updated });

    const uid = useAuthStore.getState().userId;
    const brandIntensity = useBrandStore.getState().status.visual.intensity;
    if (uid) {
      await saveProgressionToCloud(uid, updated, brandIntensity);
      console.log("🔥 [PLAYER STORE] advanceToNextCheckpointDev synced", {
        uid,
        totalSteps: updated.totalSteps,
        totalDistanceKm: updated.totalDistanceKm,
        nextCheckpointId: nextCheckpoint.id,
      });
    } else {
      console.log("🔥 [PLAYER STORE] checkpoint advance skipped cloud sync (no uid)");
    }
  },
  resetProgressionDev: async () => {
    const resetProgress: PlayerProgress = {
      totalSteps: 0,
      totalDistanceKm: 0,
      progressPct: 0,
      currentStageId: "stage-001",
      currentStageProgressPct: 0,
      streakDays: 0,
      brandState: "idle",
      lastActiveDateISO: new Date(0).toISOString(),
    };

    set({ progress: resetProgress });

    const uid = useAuthStore.getState().userId;
    const brandIntensity = useBrandStore.getState().status.visual.intensity;
    if (uid) {
      await saveProgressionToCloud(uid, resetProgress, brandIntensity);
      console.log("🔥 [PLAYER STORE] resetProgressionDev synced", {
        uid,
        totalSteps: resetProgress.totalSteps,
        totalDistanceKm: resetProgress.totalDistanceKm,
        currentStageId: resetProgress.currentStageId,
        currentStageProgressPct: resetProgress.currentStageProgressPct,
      });
    } else {
      console.log("🔥 [PLAYER STORE] reset skipped cloud sync (no uid)");
    }
  },
}));
