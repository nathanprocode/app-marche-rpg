jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../../core/firebase", () => ({
  subscribeFirebaseAuthState: jest.fn(),
  signOutFirebase: jest.fn(),
}));
jest.mock("../../userCloud/service", () => ({
  saveProgressionToCloud: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveProgressionToCloud } from "../../userCloud/service";
import { useAuthStore } from "../../../store/useAuthStore";
import { useBrandStore } from "../../../store/useBrandStore";
import { usePedometerStore } from "../../../store/usePedometerStore";
import { usePlayerStore } from "../../../store/usePlayerStore";
import { eraseAllProgress } from "../eraseProgress";

const saveToCloud = saveProgressionToCloud as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  saveToCloud.mockClear();
  useAuthStore.setState({ isAuthenticated: true, userId: "guts", userName: "Test", isAuthResolved: true });
  await usePlayerStore.getState().hydrateLocalProgress("guts");
});

describe("eraseAllProgress", () => {
  it("remet progression, records, succès, pas du jour et historique à zéro", async () => {
    usePedometerStore.getState().setLiveSteps(14_000);
    await usePlayerStore.getState().syncFromSteps(14_000, 5, new Date().toISOString());
    expect(usePlayerStore.getState().achievements["km-10"]).toBeDefined();

    await eraseAllProgress();

    expect(usePlayerStore.getState().progress.totalSteps).toBe(0);
    expect(usePlayerStore.getState().progress.lap).toBe(1);
    expect(usePlayerStore.getState().bestStreak).toBe(0);
    expect(usePlayerStore.getState().achievements).toEqual({});
    expect(usePedometerStore.getState().stepsToday).toBe(0);
    expect(usePedometerStore.getState().history).toEqual({});
    expect(useBrandStore.getState().status.streakDays).toBe(0);
  });

  it("écrase la sauvegarde cloud tout de suite", async () => {
    await usePlayerStore.getState().syncFromSteps(14_000, 0, new Date(0).toISOString());
    saveToCloud.mockClear();

    await eraseAllProgress();

    expect(saveToCloud).toHaveBeenCalledTimes(1);
    expect(saveToCloud.mock.calls[0][1].totalSteps).toBe(0);
    expect(saveToCloud.mock.calls[0][4]).toEqual({ bestStreak: 0, bestDaySteps: 0, achievements: {} });
  });
});
