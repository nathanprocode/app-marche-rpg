import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { GAME_CONFIG, STEPS_PER_LAP } from "../core/constants/game";
import { findNewAchievements } from "../features/achievements/achievements";
import { buildAchievementStats } from "../features/achievements/stats";
import { BOSS_ENCOUNTERS } from "../data/bosses";
import { computeDuels, diffDuels, victoryKey, type BossEvent } from "../features/bosses/duel";
import { BERSERK_CHECKPOINTS } from "../data/map/berserk-checkpoints";
import { buildProgressFromSteps } from "../features/progression/engine";
import { parseSavedProgress, pickSavedProgress, type SavedProgress } from "../features/progression/savedProgress";
import { saveProgressionToCloud } from "../features/userCloud/service";
import type { PlayerProgress } from "../features/progression/types";
import { useAuthStore } from "./useAuthStore";
import { useSocialStore } from "./useSocialStore";
import { isGoalReached } from "../features/progression/selectors";
import { useBrandStore } from "./useBrandStore";
import { usePedometerStore } from "./usePedometerStore";
import { useSettingsStore } from "./useSettingsStore";

const initialProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());
const EMPTY_EXTRAS = {
  bestStreak: 0,
  bestDaySteps: 0,
  achievements: {} as Record<string, string>,
  bossVictories: {} as Record<string, string>,
};
const PERMANENT_TRACKING_STORAGE_KEY = "marche-du-faucon:permanent-tracking-enabled";
const LOCAL_PROGRESS_KEY_PREFIX = "marche-du-faucon:progress:";
/** Firestore reçoit au plus une écriture par période : le local, lui, est sauvegardé à chaque pas. */
const CLOUD_SAVE_DELAY_MS = 30_000;

type PlayerState = {
  progress: PlayerProgress;
  unlockedCheckpoints: string[];
  /** Records et succès : ils survivent aux tours de Traque. */
  bestStreak: number;
  bestDaySteps: number;
  /** Succès débloqués : identifiant → date ISO. */
  achievements: Record<string, string>;
  /** Succès gagnés pendant cette session, pas encore montrés (le toast les vide). */
  newAchievementIds: string[];
  /** Duels gagnés : « tour/identifiant du duel » → date ISO. */
  bossVictories: Record<string, string>;
  /** Changements de forme et victoires de cette session, pas encore montrés (l'écran de duel les vide). */
  newBossEvents: BossEvent[];
  isPermanentTrackingEnabled: boolean;
  /** Charge la sauvegarde locale du compte. Renvoie false s'il n'y en a pas (progression remise à zéro). */
  hydrateLocalProgress: (uid: string) => Promise<boolean>;
  /** Fusionne la sauvegarde Firestore avec l'état actuel (voir pickSavedProgress). */
  mergeCloudProgress: (cloud: SavedProgress) => Promise<void>;
  setPermanentTrackingEnabled: (enabled: boolean) => void;
  hydratePermanentTrackingPreference: () => Promise<void>;
  syncFromSteps: (totalSteps: number, streakDays: number, lastActiveDateISO: string) => Promise<void>;
  /** Clôt la Traque terminée et en commence une autre (les pas en trop sont reportés). */
  startNextLap: () => Promise<void>;
  clearNewAchievements: () => void;
  clearNewBossEvents: () => void;
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

type Extras = Pick<PlayerState, "bestStreak" | "bestDaySteps" | "achievements" | "bossVictories">;

function toSavedProgress(progress: PlayerProgress, unlockedCheckpoints: string[], extras: Extras): SavedProgress {
  return {
    totalSteps: progress.totalSteps,
    streakDays: progress.streakDays,
    lastActiveDateISO: progress.lastActiveDateISO,
    unlockedCheckpoints,
    updatedAtISO: new Date().toISOString(),
    lap: progress.lap,
    lapStartSteps: progress.lapStartSteps,
    ...extras,
  };
}

function extrasOf(state: PlayerState): Extras {
  return {
    bestStreak: state.bestStreak,
    bestDaySteps: state.bestDaySteps,
    achievements: state.achievements,
    bossVictories: state.bossVictories,
  };
}

/** Pas du jour et objectif en vigueur : la Marque en dépend. */
function progressOptions(lap: number, lapStartSteps: number) {
  return { lap, lapStartSteps, dailyGoal: useSettingsStore.getState().dailyGoal };
}

function buildStateFromSaved(saved: SavedProgress): Pick<PlayerState, "progress" | "unlockedCheckpoints"> & Extras {
  const progress = buildProgressFromSteps(
    saved.totalSteps,
    saved.streakDays,
    saved.lastActiveDateISO,
    usePedometerStore.getState().stepsToday,
    progressOptions(saved.lap, saved.lapStartSteps),
  );
  return {
    progress,
    unlockedCheckpoints: resolveUnlockedCheckpoints(progress.totalDistanceKm, saved.unlockedCheckpoints),
    bestStreak: saved.bestStreak,
    bestDaySteps: saved.bestDaySteps,
    achievements: saved.achievements,
    bossVictories: saved.bossVictories,
  };
}

type ExtrasState = Pick<
  PlayerState,
  "bestStreak" | "bestDaySteps" | "achievements" | "newAchievementIds" | "bossVictories" | "newBossEvents"
>;

/**
 * Met à jour records, succès et duels de boss à partir de l'état courant. Renvoie les champs à ajouter à l'état.
 * `silent` : au chargement, on rattrape les succès et victoires déjà mérités sans les annoncer.
 * `previous` : la progression d'avant ce changement, pour repérer un changement de forme ou une victoire.
 */
function computeExtras(
  progress: PlayerProgress,
  unlockedCheckpoints: string[],
  current: ExtrasState,
  silent = false,
  previous?: PlayerProgress,
): ExtrasState {
  const nowISO = new Date().toISOString();
  const bestStreak = Math.max(current.bestStreak, progress.streakDays);
  const bestDaySteps = Math.max(current.bestDaySteps, usePedometerStore.getState().stepsToday);

  const duels = computeDuels(BOSS_ENCOUNTERS, progress.lapSteps, BERSERK_CHECKPOINTS);
  const bossVictories = { ...current.bossVictories };
  for (const duel of duels) {
    const key = victoryKey(progress.lap, duel.encounter.id);
    if (duel.state === "won" && !bossVictories[key]) bossVictories[key] = nowISO;
  }
  // D'un tour à l'autre, les duels repartent de zéro : on ne compare que des états du même tour.
  const bossEvents =
    !silent && previous && previous.lap === progress.lap
      ? diffDuels(computeDuels(BOSS_ENCOUNTERS, previous.lapSteps, BERSERK_CHECKPOINTS), duels, progress.lap)
      : [];

  const newIds = findNewAchievements(
    buildAchievementStats(progress, unlockedCheckpoints, bestStreak, bestDaySteps, bossVictories),
    current.achievements,
  );

  return {
    bestStreak,
    bestDaySteps,
    achievements: { ...current.achievements, ...Object.fromEntries(newIds.map((id) => [id, nowISO])) },
    newAchievementIds: silent ? current.newAchievementIds : [...current.newAchievementIds, ...newIds],
    bossVictories,
    newBossEvents: [...current.newBossEvents, ...bossEvents],
  };
}

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
let cloudSaveUid: string | null = null;

/** Ce que la Bande voit de toi : nom, tour, distance du tour, série. */
export function myBandStatus(uid: string) {
  const { progress } = usePlayerStore.getState();
  return {
    uid,
    displayName: useAuthStore.getState().userName ?? "Traqué",
    lap: progress.lap,
    totalDistanceKm: progress.totalDistanceKm,
    streakDays: progress.streakDays,
  };
}

async function saveToCloudNow(uid: string): Promise<void> {
  // Le compte a changé depuis la programmation : l'état en mémoire n'est plus le sien.
  if (useAuthStore.getState().userId !== uid) return;

  const state = usePlayerStore.getState();
  const brandIntensity = useBrandStore.getState().status.visual.intensity;
  try {
    // Hors ligne, Firestore garde l'écriture en file et ne répond qu'au retour du réseau.
    await saveProgressionToCloud(uid, state.progress, brandIntensity, state.unlockedCheckpoints, extrasOf(state));
    // Les amis de la Bande voient la même position, au même rythme que la sauvegarde.
    await useSocialStore.getState().publish(myBandStatus(uid));
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

async function saveCurrentProgress(
  progression: PlayerProgress,
  unlockedCheckpoints: string[],
  extras: Extras,
): Promise<void> {
  const uid = useAuthStore.getState().userId;
  if (!uid) return;

  try {
    await AsyncStorage.setItem(
      LOCAL_PROGRESS_KEY_PREFIX + uid,
      JSON.stringify(toSavedProgress(progression, unlockedCheckpoints, extras)),
    );
  } catch (error) {
    console.log("[PlayerStore] local save failed", error);
  }
  scheduleCloudSave(uid);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progress: initialProgress,
  unlockedCheckpoints: resolveUnlockedCheckpoints(initialProgress.totalDistanceKm),
  ...EMPTY_EXTRAS,
  newAchievementIds: [],
  newBossEvents: [],
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
      set({
        progress: initialProgress,
        unlockedCheckpoints: resolveUnlockedCheckpoints(initialProgress.totalDistanceKm),
        ...EMPTY_EXTRAS,
        newAchievementIds: [],
        newBossEvents: [],
      });
      return false;
    }

    const next = buildStateFromSaved(saved);
    set({ ...next, ...computeExtras(next.progress, next.unlockedCheckpoints, { ...next, newAchievementIds: [], newBossEvents: [] }, true) });
    return true;
  },
  mergeCloudProgress: async (cloud) => {
    const state = get();
    const picked = pickSavedProgress(toSavedProgress(state.progress, state.unlockedCheckpoints, extrasOf(state)), cloud);
    if (!picked) return;

    const built = buildStateFromSaved(picked);
    const next = { ...built, ...computeExtras(
        built.progress,
        built.unlockedCheckpoints,
        { ...built, newAchievementIds: get().newAchievementIds, newBossEvents: get().newBossEvents },
        true,
      ) };
    set(next);
    // Une sauvegarde par démarrage : le local reçoit le cloud s'il gagne, et inversement.
    await saveCurrentProgress(next.progress, next.unlockedCheckpoints, extrasOf({ ...get(), ...next }));
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
    const { lap, lapStartSteps } = get().progress;
    const progress = buildProgressFromSteps(
      totalSteps,
      streakDays,
      lastActiveDateISO,
      stepsToday,
      progressOptions(lap, lapStartSteps),
    );
    const unlockedCheckpoints = resolveUnlockedCheckpoints(progress.totalDistanceKm, get().unlockedCheckpoints);
    const extras = computeExtras(progress, unlockedCheckpoints, get(), false, get().progress);

    set({ progress, unlockedCheckpoints, ...extras });

    await saveCurrentProgress(progress, unlockedCheckpoints, extras);
  },
  startNextLap: async () => {
    const current = get().progress;
    if (!isGoalReached(current)) return;

    // Les pas au-delà de 1 000 km ne sont pas perdus : ils comptent déjà dans le nouveau tour.
    const lapStartSteps = current.lapStartSteps + STEPS_PER_LAP;
    const progress = buildProgressFromSteps(
      current.totalSteps,
      current.streakDays,
      current.lastActiveDateISO,
      usePedometerStore.getState().stepsToday,
      progressOptions(current.lap + 1, lapStartSteps),
    );
    const unlockedCheckpoints = resolveUnlockedCheckpoints(progress.totalDistanceKm, get().unlockedCheckpoints);
    const extras = computeExtras(progress, unlockedCheckpoints, get(), false, get().progress);

    set({ progress, unlockedCheckpoints, ...extras });
    await saveCurrentProgress(progress, unlockedCheckpoints, extras);
    // Tout de suite : sinon un autre appareil, resté sur l'ancien tour, pourrait l'emporter à la fusion.
    flushCloudSave();
  },
  clearNewAchievements: () => set({ newAchievementIds: [] }),
  clearNewBossEvents: () => set({ newBossEvents: [] }),
  addDevSteps: async (stepsToAdd = 500) => {
    const current = get().progress;
    // Comme un vrai pas : on compte aussi les pas du jour, sinon la Marque et la série ne réagissent jamais.
    const nextStepsToday = usePedometerStore.getState().addLiveSteps(stepsToAdd);

    const updated = buildProgressFromSteps(
      current.totalSteps + stepsToAdd,
      current.streakDays,
      current.lastActiveDateISO,
      nextStepsToday,
      progressOptions(current.lap, current.lapStartSteps),
    );
    const unlockedCheckpoints = resolveUnlockedCheckpoints(updated.totalDistanceKm, get().unlockedCheckpoints);
    const extras = computeExtras(updated, unlockedCheckpoints, get(), false, get().progress);

    set({ progress: updated, unlockedCheckpoints, ...extras });
    await saveCurrentProgress(updated, unlockedCheckpoints, extras);
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
      current.lapStartSteps + stepsForKm(nextCheckpoint.kmThreshold),
      current.streakDays,
      current.lastActiveDateISO,
      usePedometerStore.getState().stepsToday,
      progressOptions(current.lap, current.lapStartSteps),
    );
    const unlockedCheckpoints = resolveUnlockedCheckpoints(updated.totalDistanceKm, get().unlockedCheckpoints);
    const extras = computeExtras(updated, unlockedCheckpoints, get(), false, get().progress);

    set({ progress: updated, unlockedCheckpoints, ...extras });
    await saveCurrentProgress(updated, unlockedCheckpoints, extras);
  },
  resetProgressionDev: async () => {
    const resetProgress: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());
    const unlockedCheckpoints = resolveUnlockedCheckpoints(resetProgress.totalDistanceKm);

    set({ progress: resetProgress, unlockedCheckpoints, ...EMPTY_EXTRAS, newAchievementIds: [], newBossEvents: [] });
    await saveCurrentProgress(resetProgress, unlockedCheckpoints, EMPTY_EXTRAS);
    // Tout de suite : sinon, au prochain démarrage, le cloud (plus de pas) l'emporterait sur le local remis à zéro.
    flushCloudSave();
  },
}));
