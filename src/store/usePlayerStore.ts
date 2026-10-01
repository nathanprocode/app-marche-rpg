import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { GAME_CONFIG } from "../core/constants/game";
import { BERSERK_CHECKPOINTS } from "../data/map/berserk-checkpoints";
import { buildProgressFromSteps } from "../features/progression/engine";
import { parseSavedProgress, pickSavedProgress, type SavedProgress } from "../features/progression/savedProgress";
import { saveProgressionToCloud } from "../features/userCloud/service";
import type { PlayerProgress } from "../features/progression/types";
import { useAuthStore } from "./useAuthStore";
import { useBrandStore } from "./useBrandStore";
import { usePedometerStore } from "./usePedometerStore";

const initialProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());
const PERMANENT_TRACKING_STORAGE_KEY = "marche-du-faucon:permanent-tracking-enabled";
const LOCAL_PROGRESS_KEY_PREFIX = "marche-du-faucon:progress:";
/** Firestore reçoit au plus une écriture par période : le local, lui, est sauvegardé à chaque pas. */
const CLOUD_SAVE_DELAY_MS = 30_000;

type PlayerState = {
  progress: PlayerProgress;
  unlockedCheckpoints: string[];
  isPermanentTrackingEnabled: boolean;
  /** Charge la sauvegarde locale du compte. Renvoie false s'il n'y en a pas (progression remise à zéro). */
  hydrateLocalProgress: (uid: string) => Promise<boolean>;
  /** Fusionne la sauvegarde Firestore avec l'état actuel (voir pickSavedProgress). */
  mergeCloudProgress: (cloud: SavedProgress) => Promise<void>;
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

function toSavedProgress(progress: PlayerProgress, unlockedCheckpoints: string[]): SavedProgress {
  return {
    totalSteps: progress.totalSteps,
    streakDays: progress.streakDays,
    lastActiveDateISO: progress.lastActiveDateISO,
    unlockedCheckpoints,
    updatedAtISO: new Date().toISOString(),
  };
}

function buildStateFromSaved(saved: SavedProgress): Pick<PlayerState, "progress" | "unlockedCheckpoints"> {
  const progress = buildProgressFromSteps(
    saved.totalSteps,
    saved.streakDays,
    saved.lastActiveDateISO,
    usePedometerStore.getState().stepsToday,
  );
  return { progress, unlockedCheckpoints: resolveUnlockedCheckpoints(progress.totalDistanceKm, saved.unlockedCheckpoints) };
}

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
let cloudSaveUid: string | null = null;

async function saveToCloudNow(uid: string): Promise<void> {
  // Le compte a changé depuis la programmation : l'état en mémoire n'est plus le sien.
  if (useAuthStore.getState().userId !== uid) return;

  const { progress, unlockedCheckpoints } = usePlayerStore.getState();
  const brandIntensity = useBrandStore.getState().status.visual.intensity;
  try {
    // Hors ligne, Firestore garde l'écriture en file et ne répond qu'au retour du réseau.
    await saveProgressionToCloud(uid, progress, brandIntensity, unlockedCheckpoints);
  } catch (error) {
    console.log("[PlayerStore] cloud save failed", error);
  }
}

function scheduleCloudSave(uid: string): void {
  if (cloudSaveTimer && cloudSaveUid === uid) return;
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);

  cloudSaveUid = uid;
  cloudSaveTimer = setTimeout(() => {
    cloudSaveTimer = null;
    void saveToCloudNow(uid);
  }, CLOUD_SAVE_DELAY_MS);
}

/** Envoie tout de suite la sauvegarde cloud en attente (app en arrière-plan, déconnexion). */
export function flushCloudSave(): void {
  if (!cloudSaveTimer || !cloudSaveUid) return;

  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = null;
  void saveToCloudNow(cloudSaveUid);
}

async function saveCurrentProgress(progression: PlayerProgress, unlockedCheckpoints: string[]): Promise<void> {
  const uid = useAuthStore.getState().userId;
  if (!uid) return;

  try {
    await AsyncStorage.setItem(
      LOCAL_PROGRESS_KEY_PREFIX + uid,
      JSON.stringify(toSavedProgress(progression, unlockedCheckpoints)),
    );
  } catch (error) {
    console.log("[PlayerStore] local save failed", error);
  }
  scheduleCloudSave(uid);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progress: initialProgress,
  unlockedCheckpoints: resolveUnlockedCheckpoints(initialProgress.totalDistanceKm),
  isPermanentTrackingEnabled: false,
  hydrateLocalProgress: async (uid) => {
    let saved: SavedProgress | null = null;
    try {
      const storedValue = await AsyncStorage.getItem(LOCAL_PROGRESS_KEY_PREFIX + uid);
      saved = storedValue ? parseSavedProgress(JSON.parse(storedValue)) : null;
    } catch (error) {
      console.log("[PlayerStore] unable to read local progress", error);
    }

    if (!saved) {
      set({ progress: initialProgress, unlockedCheckpoints: resolveUnlockedCheckpoints(initialProgress.totalDistanceKm) });
      return false;
    }

    set(buildStateFromSaved(saved));
    return true;
  },
  mergeCloudProgress: async (cloud) => {
    const { progress, unlockedCheckpoints } = get();
    const picked = pickSavedProgress(toSavedProgress(progress, unlockedCheckpoints), cloud);
    if (!picked) return;

    const next = buildStateFromSaved(picked);
    set(next);
    // Une sauvegarde par démarrage : le local reçoit le cloud s'il gagne, et inversement.
    await saveCurrentProgress(next.progress, next.unlockedCheckpoints);
  },
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
    const stepsToday = usePedometerStore.getState().stepsToday;
    const progress = buildProgressFromSteps(totalSteps, streakDays, lastActiveDateISO, stepsToday);
    const unlockedCheckpoints = resolveUnlockedCheckpoints(progress.totalDistanceKm, get().unlockedCheckpoints);

    set({ progress, unlockedCheckpoints });

    await saveCurrentProgress(progress, unlockedCheckpoints);
  },
  addDevSteps: async (stepsToAdd = 500) => {
    const current = get().progress;
    // Comme un vrai pas : on compte aussi les pas du jour, sinon la Marque et la série ne réagissent jamais.
    const nextStepsToday = usePedometerStore.getState().addLiveSteps(stepsToAdd);

    const updated = buildProgressFromSteps(
      current.totalSteps + stepsToAdd,
      current.streakDays,
      current.lastActiveDateISO,
      nextStepsToday,
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
    const resetProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());
    const unlockedCheckpoints = resolveUnlockedCheckpoints(resetProgress.totalDistanceKm);

    set({ progress: resetProgress, unlockedCheckpoints });
    await saveCurrentProgress(resetProgress, unlockedCheckpoints);
    // Tout de suite : sinon, au prochain démarrage, le cloud (plus de pas) l'emporterait sur le local remis à zéro.
    flushCloudSave();
  },
}));
