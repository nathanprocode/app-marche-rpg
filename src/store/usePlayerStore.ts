import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { GAME_CONFIG } from "../core/constants/game";
import { BERSERK_CHECKPOINTS } from "../data/map/berserk-checkpoints";
import { buildProgressFromSteps } from "../features/progression/engine";
import { saveProgressionToCloud } from "../features/userCloud/service";
import type { PlayerProgress } from "../features/progression/types";
import { useAuthStore } from "./useAuthStore";
import { useBrandStore } from "./useBrandStore";

const initialProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());
const PERMANENT_TRACKING_STORAGE_KEY = "marche-du-faucon:permanent-tracking-enabled";

type PlayerState = {
  progress: PlayerProgress;
  unlockedCheckpoints: string[];
  isPermanentTrackingEnabled: boolean;
  setProgress: (progress: PlayerProgress) => void;
  setUnlockedCheckpoints: (checkpointIds: string[]) => void;
  setPermanentTrackingEnabled: (enabled: boolean) => void;
  hydratePermanentTrackingPreference: () => Promise<void>;
  syncFromSteps: (totalSteps: number, streakDays: number, lastActiveDateISO: string) => Promise<void>;
  addDevSteps: (stepsToAdd?: number) => Promise<void>;
  advanceToNextCheckpointDev: () => Promise<void>;
  resetProgressionDev: () => Promise<void>;
};

function stepsForKm(km: number): number {
  return Math.ceil((km * 1000) / GAME_CONFIG.metersPerStep);
}

function resolveUnlockedCheckpoints(totalDistanceKm: number, currentIds: string[] = []): string[] {
  const reachedIds = BERSERK_CHECKPOINTS.filter(
    (checkpoint) => checkpoint.kmThreshold <= totalDistanceKm + 0.0001,
  ).map((checkpoint) => checkpoint.id);

  return Array.from(new Set([...currentIds, ...reachedIds]));
}

async function saveCurrentProgress(progression: PlayerProgress, unlockedCheckpoints: string[]): Promise<void> {
  const uid = useAuthStore.getState().userId;
  const brandIntensity = useBrandStore.getState().status.visual.intensity;

  if (uid) {
    await saveProgressionToCloud(uid, progression, brandIntensity, unlockedCheckpoints);
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progress: initialProgress,
  unlockedCheckpoints: resolveUnlockedCheckpoints(initialProgress.totalDistanceKm),
  isPermanentTrackingEnabled: false,
  setProgress: (progress) =>
    set((state) => ({
      progress,
      unlockedCheckpoints: resolveUnlockedCheckpoints(progress.totalDistanceKm, state.unlockedCheckpoints),
    })),
  setUnlockedCheckpoints: (checkpointIds) => set({ unlockedCheckpoints: checkpointIds }),
  setPermanentTrackingEnabled: (enabled) => {
    set({ isPermanentTrackingEnabled: enabled });
    void AsyncStorage.setItem(PERMANENT_TRACKING_STORAGE_KEY, enabled ? "true" : "false");
  },
  hydratePermanentTrackingPreference: async () => {
    const storedValue = await AsyncStorage.getItem(PERMANENT_TRACKING_STORAGE_KEY);
    if (storedValue === null) {
      return;
    }

    set({ isPermanentTrackingEnabled: storedValue === "true" });
  },
  syncFromSteps: async (totalSteps, streakDays, lastActiveDateISO) => {
    const progress = buildProgressFromSteps(totalSteps, streakDays, lastActiveDateISO);
    const unlockedCheckpoints = resolveUnlockedCheckpoints(progress.totalDistanceKm, get().unlockedCheckpoints);

    set({ progress, unlockedCheckpoints });

    await saveCurrentProgress(progress, unlockedCheckpoints);
  },
  addDevSteps: async (stepsToAdd = 500) => {
    const current = get().progress;
    const updated = buildProgressFromSteps(
      current.totalSteps + stepsToAdd,
      current.streakDays,
      current.lastActiveDateISO,
    );
    const unlockedCheckpoints = resolveUnlockedCheckpoints(updated.totalDistanceKm, get().unlockedCheckpoints);

    set({ progress: updated, unlockedCheckpoints });
    await saveCurrentProgress(updated, unlockedCheckpoints);
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
    const unlockedCheckpoints = resolveUnlockedCheckpoints(updated.totalDistanceKm, get().unlockedCheckpoints);

    set({ progress: updated, unlockedCheckpoints });
    await saveCurrentProgress(updated, unlockedCheckpoints);
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
    const unlockedCheckpoints = resolveUnlockedCheckpoints(resetProgress.totalDistanceKm);

    set({ progress: resetProgress, unlockedCheckpoints });
    await saveCurrentProgress(resetProgress, unlockedCheckpoints);
  },
}));
