import { create } from "zustand";
import { readStepsToday, stepsToKm } from "../features/pedometer/service";

type PedometerState = {
  stepsToday: number;
  distanceTodayKm: number;
  lastSyncISO: string | null;
  syncSteps: () => Promise<void>;
};

export const usePedometerStore = create<PedometerState>((set, get) => ({
  stepsToday: 0,
  distanceTodayKm: 0,
  lastSyncISO: null,
  syncSteps: async () => {
    const snapshot = await readStepsToday(get().stepsToday);
    set({
      stepsToday: snapshot.stepsToday,
      distanceTodayKm: stepsToKm(snapshot.stepsToday),
      lastSyncISO: snapshot.updatedAtISO,
    });
  },
}));
