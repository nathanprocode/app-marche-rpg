import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { readStepsToday, stepsToKm } from "../features/pedometer/service";

const PEDOMETER_DAY_STORAGE_KEY = "marche-du-faucon:pedometer-day";
const PEDOMETER_HISTORY_STORAGE_KEY = "marche-du-faucon:pedometer-history";

export type DailyDistanceEntry = {
  dayKey: string;
  steps: number;
  distanceKm: number;
  updatedAtISO: string | null;
};

type StoredPedometerDay = {
  dayKey: string;
  stepsToday: number;
  lastSyncISO: string | null;
};

type PedometerState = {
  stepsToday: number;
  distanceTodayKm: number;
  dailyHistory: DailyDistanceEntry[];
  lastSyncISO: string | null;
  setLiveSteps: (stepsToday: number, updatedAtISO?: string) => void;
  applyDailyStepDeltas: (dailyStepDeltas: Record<string, number>, updatedAtISO?: string) => number;
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

function normalizeHistoryEntry(entry: Partial<DailyDistanceEntry>): DailyDistanceEntry | null {
  if (!entry.dayKey) {
    return null;
  }

  const steps = normalizeSteps(entry.steps ?? 0);

  return {
    dayKey: entry.dayKey,
    steps,
    distanceKm: stepsToKm(steps),
    updatedAtISO: entry.updatedAtISO ?? null,
  };
}

function upsertDailyHistory(
  history: DailyDistanceEntry[],
  dayKey: string,
  steps: number,
  updatedAtISO: string | null,
): DailyDistanceEntry[] {
  const normalizedSteps = normalizeSteps(steps);
  const nextEntry: DailyDistanceEntry = {
    dayKey,
    steps: normalizedSteps,
    distanceKm: stepsToKm(normalizedSteps),
    updatedAtISO,
  };

  return [
    ...history.filter((entry) => entry.dayKey !== dayKey),
    nextEntry,
  ]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(-30);
}

async function persistStepsToday(stepsToday: number, lastSyncISO: string | null): Promise<void> {
  const payload: StoredPedometerDay = {
    dayKey: getLocalDayKey(),
    stepsToday: normalizeSteps(stepsToday),
    lastSyncISO,
  };

  await AsyncStorage.setItem(PEDOMETER_DAY_STORAGE_KEY, JSON.stringify(payload));
}

async function persistDailyHistory(history: DailyDistanceEntry[]): Promise<void> {
  await AsyncStorage.setItem(PEDOMETER_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export const usePedometerStore = create<PedometerState>((set, get) => ({
  stepsToday: 0,
  distanceTodayKm: 0,
  dailyHistory: [],
  lastSyncISO: null,
  setLiveSteps: (stepsToday, updatedAtISO = new Date().toISOString()) => {
    const normalizedSteps = normalizeSteps(stepsToday);
    const dailyHistory = upsertDailyHistory(
      get().dailyHistory,
      getLocalDayKey(),
      normalizedSteps,
      updatedAtISO,
    );

    set({
      stepsToday: normalizedSteps,
      distanceTodayKm: stepsToKm(normalizedSteps),
      dailyHistory,
      lastSyncISO: updatedAtISO,
    });
    void persistStepsToday(normalizedSteps, updatedAtISO);
    void persistDailyHistory(dailyHistory);
  },
  applyDailyStepDeltas: (dailyStepDeltas, updatedAtISO = new Date().toISOString()) => {
    const todayKey = getLocalDayKey();
    const currentState = get();
    let dailyHistory = currentState.dailyHistory;
    let nextStepsToday = currentState.stepsToday;
    let totalDeltaSteps = 0;

    Object.entries(dailyStepDeltas).forEach(([dayKey, deltaSteps]) => {
      const normalizedDelta = normalizeSteps(deltaSteps);
      if (!dayKey || normalizedDelta <= 0) {
        return;
      }

      const existingSteps = dailyHistory.find((entry) => entry.dayKey === dayKey)?.steps ?? 0;
      const nextDaySteps = existingSteps + normalizedDelta;
      dailyHistory = upsertDailyHistory(dailyHistory, dayKey, nextDaySteps, updatedAtISO);
      totalDeltaSteps += normalizedDelta;

      if (dayKey === todayKey) {
        nextStepsToday += normalizedDelta;
      }
    });

    set({
      stepsToday: nextStepsToday,
      distanceTodayKm: stepsToKm(nextStepsToday),
      dailyHistory,
      lastSyncISO: updatedAtISO,
    });
    void persistStepsToday(nextStepsToday, updatedAtISO);
    void persistDailyHistory(dailyHistory);

    return totalDeltaSteps;
  },
  hydrateStepsTodayPreference: async () => {
    const storedValue = await AsyncStorage.getItem(PEDOMETER_DAY_STORAGE_KEY);
    const storedHistoryValue = await AsyncStorage.getItem(PEDOMETER_HISTORY_STORAGE_KEY);
    let dailyHistory: DailyDistanceEntry[] = [];

    if (storedHistoryValue) {
      try {
        const parsedHistory = JSON.parse(storedHistoryValue) as Partial<DailyDistanceEntry>[];
        dailyHistory = parsedHistory
          .map(normalizeHistoryEntry)
          .filter((entry): entry is DailyDistanceEntry => entry !== null);
      } catch (error) {
        console.log("[PedometerStore] unable to hydrate history", error);
        await AsyncStorage.removeItem(PEDOMETER_HISTORY_STORAGE_KEY);
      }
    }

    if (!storedValue) {
      set({ dailyHistory });
      return;
    }

    try {
      const storedDay = JSON.parse(storedValue) as Partial<StoredPedometerDay>;
      const isToday = storedDay.dayKey === getLocalDayKey();
      const stepsToday = isToday ? normalizeSteps(storedDay.stepsToday ?? 0) : 0;
      const lastSyncISO = isToday ? storedDay.lastSyncISO ?? null : null;
      const storedSteps = normalizeSteps(storedDay.stepsToday ?? 0);

      if (storedDay.dayKey) {
        dailyHistory = upsertDailyHistory(
          dailyHistory,
          storedDay.dayKey,
          isToday ? stepsToday : storedSteps,
          storedDay.lastSyncISO ?? null,
        );
      }

      set({
        stepsToday,
        distanceTodayKm: stepsToKm(stepsToday),
        dailyHistory,
        lastSyncISO,
      });

      if (!isToday) {
        await persistStepsToday(0, null);
      }
      await persistDailyHistory(dailyHistory);
    } catch (error) {
      console.log("[PedometerStore] unable to hydrate day", error);
      await AsyncStorage.removeItem(PEDOMETER_DAY_STORAGE_KEY);
    }
  },
  resetStepsToday: async () => {
    set({
      stepsToday: 0,
      distanceTodayKm: 0,
      dailyHistory: upsertDailyHistory(get().dailyHistory, getLocalDayKey(), 0, null),
      lastSyncISO: null,
    });
    await persistStepsToday(0, null);
    await persistDailyHistory(get().dailyHistory);
  },
  syncSteps: async () => {
    const snapshot = await readStepsToday(get().stepsToday);
    get().setLiveSteps(snapshot.stepsToday, snapshot.updatedAtISO);
  },
}));
