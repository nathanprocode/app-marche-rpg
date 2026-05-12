import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { readStepsToday, stepsToKm } from "../features/pedometer/service";

const PEDOMETER_DAY_STORAGE_KEY = "marche-du-faucon:pedometer-day";

type StoredPedometerDay = {
  dayKey: string;
  stepsToday: number;
  lastSyncISO: string | null;
};

type PedometerState = {
  stepsToday: number;
  distanceTodayKm: number;
  lastSyncISO: string | null;
  setLiveSteps: (stepsToday: number, updatedAtISO?: string) => void;
  hydrateStepsTodayPreference: () => Promise<void>;
  resetStepsToday: () => Promise<void>;
  syncSteps: () => Promise<void>;
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
  stepsToday: 0,
  distanceTodayKm: 0,
  lastSyncISO: null,
  setLiveSteps: (stepsToday, updatedAtISO = new Date().toISOString()) => {
    const normalizedSteps = normalizeSteps(stepsToday);

    set({
      stepsToday: normalizedSteps,
      distanceTodayKm: stepsToKm(normalizedSteps),
      lastSyncISO: updatedAtISO,
    });
    void persistStepsToday(normalizedSteps, updatedAtISO);
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
      stepsToday: 0,
      distanceTodayKm: 0,
      lastSyncISO: null,
    });
    await persistStepsToday(0, null);
  },
  syncSteps: async () => {
    const snapshot = await readStepsToday(get().stepsToday);
    get().setLiveSteps(snapshot.stepsToday, snapshot.updatedAtISO);
  },
}));
