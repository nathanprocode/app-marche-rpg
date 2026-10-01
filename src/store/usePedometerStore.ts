import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { stepsToKm } from "../features/pedometer/service";

const PEDOMETER_DAY_STORAGE_KEY = "marche-du-faucon:pedometer-day";

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
  setLiveSteps: (stepsToday: number, updatedAtISO?: string) => void;
  /** Ajoute des pas au jour en cours, en repartant de 0 si minuit est passé. Renvoie les pas du jour. */
  addLiveSteps: (deltaSteps: number) => number;
  hydrateStepsTodayPreference: () => Promise<void>;
  resetStepsToday: () => Promise<void>;
};

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
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

export const usePedometerStore = create<PedometerState>((set, get) => ({
  dayKey: getLocalDayKey(),
  stepsToday: 0,
  distanceTodayKm: 0,
  lastSyncISO: null,
  setLiveSteps: (stepsToday, updatedAtISO = new Date().toISOString()) => {
    const normalizedSteps = normalizeSteps(stepsToday);

    set({
      dayKey: getLocalDayKey(),
      stepsToday: normalizedSteps,
      distanceTodayKm: stepsToKm(normalizedSteps),
      lastSyncISO: updatedAtISO,
    });
    void persistStepsToday(normalizedSteps, updatedAtISO);
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
  hydrateStepsTodayPreference: async () => {
    const storedValue = await AsyncStorage.getItem(PEDOMETER_DAY_STORAGE_KEY);
    if (!storedValue) {
      return;
    }

    try {
      const storedDay = JSON.parse(storedValue) as Partial<StoredPedometerDay>;
      const isToday = storedDay.dayKey === getLocalDayKey();
      const stepsToday = isToday ? normalizeSteps(storedDay.stepsToday ?? 0) : 0;
      const lastSyncISO = isToday ? storedDay.lastSyncISO ?? null : null;

      set({
        dayKey: getLocalDayKey(),
        stepsToday,
        distanceTodayKm: stepsToKm(stepsToday),
        lastSyncISO,
      });

      if (!isToday) {
        await persistStepsToday(0, null);
      }
    } catch (error) {
      console.log("[PedometerStore] unable to hydrate day", error);
      await AsyncStorage.removeItem(PEDOMETER_DAY_STORAGE_KEY);
    }
  },
  resetStepsToday: async () => {
    set({
      dayKey: getLocalDayKey(),
      stepsToday: 0,
      distanceTodayKm: 0,
      lastSyncISO: null,
    });
    await persistStepsToday(0, null);
  },
}));
