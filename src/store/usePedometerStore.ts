import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { pruneHistory, toDayKey, type StepsHistory } from "../features/history/weekHistory";
import { stepsToKm } from "../features/pedometer/service";

const PEDOMETER_DAY_STORAGE_KEY = "marche-du-faucon:pedometer-day";
const PEDOMETER_HISTORY_STORAGE_KEY = "marche-du-faucon:pedometer-history";

type StoredPedometerDay = {
  dayKey: string;
  stepsToday: number;
  lastSyncISO: string | null;
};

type PedometerState = {
  /** Jour local (AAAA-MM-JJ) auquel appartient `stepsToday`. */
  dayKey: string;
  stepsToday: number;
  distanceTodayKm: number;
  lastSyncISO: string | null;
  /** Pas par jour, sur ce téléphone (60 derniers jours) : alimente les statistiques du Profil. */
  history: StepsHistory;
  setLiveSteps: (stepsToday: number, updatedAtISO?: string) => void;
  /** Ajoute des pas au jour en cours, en repartant de 0 si minuit est passé. Renvoie les pas du jour. */
  addLiveSteps: (deltaSteps: number) => number;
  /** Ajoute des pas à un jour passé de l'historique (pas mesurés avant minuit, comptés après). */
  addStepsToDay: (dayKey: string, deltaSteps: number) => void;
  hydrateStepsTodayPreference: () => Promise<void>;
  resetStepsToday: () => Promise<void>;
};

function getLocalDayKey(date = new Date()): string {
  return toDayKey(date);
}

function normalizeSteps(steps: number): number {
  return Math.max(0, Math.round(Number.isFinite(steps) ? steps : 0));
}

async function persistStepsToday(stepsToday: number, lastSyncISO: string | null): Promise<void> {
  const payload: StoredPedometerDay = {
    dayKey: getLocalDayKey(),
    stepsToday: normalizeSteps(stepsToday),
    lastSyncISO,
  };

  await AsyncStorage.setItem(PEDOMETER_DAY_STORAGE_KEY, JSON.stringify(payload));
}

function persistHistory(history: StepsHistory): void {
  AsyncStorage.setItem(PEDOMETER_HISTORY_STORAGE_KEY, JSON.stringify(history)).catch((error) => {
    console.log("[PedometerStore] unable to save history", error);
  });
}

async function readHistory(): Promise<StepsHistory> {
  try {
    const stored = await AsyncStorage.getItem(PEDOMETER_HISTORY_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(parsed).map(([dayKey, steps]) => [dayKey, normalizeSteps(Number(steps))]),
    );
  } catch (error) {
    console.log("[PedometerStore] unable to read history", error);
    return {};
  }
}

export const usePedometerStore = create<PedometerState>((set, get) => ({
  dayKey: getLocalDayKey(),
  stepsToday: 0,
  distanceTodayKm: 0,
  lastSyncISO: null,
  history: {},
  setLiveSteps: (stepsToday, updatedAtISO = new Date().toISOString()) => {
    const normalizedSteps = normalizeSteps(stepsToday);
    const now = new Date();
    const history = pruneHistory({ ...get().history, [getLocalDayKey(now)]: normalizedSteps }, now);

    set({
      dayKey: getLocalDayKey(now),
      stepsToday: normalizedSteps,
      distanceTodayKm: stepsToKm(normalizedSteps),
      lastSyncISO: updatedAtISO,
      history,
    });
    void persistStepsToday(normalizedSteps, updatedAtISO);
    persistHistory(history);
  },
  addLiveSteps: (deltaSteps) => {
    // Avec le suivi permanent, l'app tourne encore en arrière-plan à minuit : sans ce test,
    // les pas d'hier seraient enregistrés sous la date d'aujourd'hui.
    const { dayKey, stepsToday } = get();
    const base = dayKey === getLocalDayKey() ? stepsToday : 0;
    const nextStepsToday = base + normalizeSteps(deltaSteps);
    get().setLiveSteps(nextStepsToday);
    return nextStepsToday;
  },
  addStepsToDay: (dayKey, deltaSteps) => {
    const delta = normalizeSteps(deltaSteps);
    if (delta <= 0) return;

    const { history } = get();
    const nextHistory = pruneHistory({ ...history, [dayKey]: (history[dayKey] ?? 0) + delta }, new Date());
    set({ history: nextHistory });
    persistHistory(nextHistory);
  },
  hydrateStepsTodayPreference: async () => {
    let history = await readHistory();
    const storedValue = await AsyncStorage.getItem(PEDOMETER_DAY_STORAGE_KEY);
    if (!storedValue) {
      set({ history });
      return;
    }

    try {
      const storedDay = JSON.parse(storedValue) as Partial<StoredPedometerDay>;
      const isToday = storedDay.dayKey === getLocalDayKey();
      const stepsToday = isToday ? normalizeSteps(storedDay.stepsToday ?? 0) : 0;
      const lastSyncISO = isToday ? storedDay.lastSyncISO ?? null : null;

      // Le dernier jour enregistré reste dans l'historique, même s'il est passé.
      if (storedDay.dayKey) {
        const storedSteps = normalizeSteps(storedDay.stepsToday ?? 0);
        history = pruneHistory(
          { ...history, [storedDay.dayKey]: Math.max(history[storedDay.dayKey] ?? 0, storedSteps) },
          new Date(),
        );
      }

      set({
        dayKey: getLocalDayKey(),
        stepsToday,
        distanceTodayKm: stepsToKm(stepsToday),
        lastSyncISO,
        history,
      });

      if (!isToday) {
        await persistStepsToday(0, null);
      }
    } catch (error) {
      console.log("[PedometerStore] unable to hydrate day", error);
      set({ history });
      await AsyncStorage.removeItem(PEDOMETER_DAY_STORAGE_KEY);
    }
  },
  resetStepsToday: async () => {
    const history = { ...get().history, [getLocalDayKey()]: 0 };
    set({
      dayKey: getLocalDayKey(),
      stepsToday: 0,
      distanceTodayKm: 0,
      lastSyncISO: null,
      history,
    });
    persistHistory(history);
    await persistStepsToday(0, null);
  },
}));
