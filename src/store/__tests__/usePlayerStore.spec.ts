jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../core/firebase", () => ({
  subscribeFirebaseAuthState: jest.fn(),
  signOutFirebase: jest.fn(),
}));
jest.mock("../../features/userCloud/service", () => ({
  saveProgressionToCloud: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveProgressionToCloud } from "../../features/userCloud/service";
import type { SavedProgress } from "../../features/progression/savedProgress";
import { useAuthStore } from "../useAuthStore";
import { flushCloudSave, usePlayerStore } from "../usePlayerStore";

const saveToCloud = saveProgressionToCloud as jest.Mock;
const NEVER = new Date(0).toISOString();

function cloud(totalSteps: number, streakDays = 0): SavedProgress {
  return { totalSteps, streakDays, lastActiveDateISO: NEVER, unlockedCheckpoints: [], updatedAtISO: NEVER };
}

function signIn(uid: string): void {
  useAuthStore.setState({ isAuthenticated: true, userId: uid, userName: "Test", isAuthResolved: true });
}

beforeEach(async () => {
  jest.useFakeTimers();
  saveToCloud.mockClear();
  await AsyncStorage.clear();
  signIn("guts");
  await usePlayerStore.getState().hydrateLocalProgress("guts");
});

afterEach(() => {
  flushCloudSave();
  jest.useRealTimers();
});

describe("sauvegarde locale", () => {
  it("relit la progression après un redémarrage, sans réseau", async () => {
    await usePlayerStore.getState().syncFromSteps(12_000, 3, NEVER);
    usePlayerStore.setState({ progress: { ...usePlayerStore.getState().progress, totalSteps: 0 } });

    expect(await usePlayerStore.getState().hydrateLocalProgress("guts")).toBe(true);
    expect(usePlayerStore.getState().progress.totalSteps).toBe(12_000);
    expect(usePlayerStore.getState().progress.streakDays).toBe(3);
  });

  it("garde une sauvegarde par compte", async () => {
    await usePlayerStore.getState().syncFromSteps(12_000, 3, NEVER);

    signIn("casca");
    expect(await usePlayerStore.getState().hydrateLocalProgress("casca")).toBe(false);
    expect(usePlayerStore.getState().progress.totalSteps).toBe(0);
  });
});

describe("fusion avec le cloud", () => {
  it("garde les pas comptés en local quand le cloud est en retard", async () => {
    await usePlayerStore.getState().syncFromSteps(9_000, 2, NEVER);
    await usePlayerStore.getState().mergeCloudProgress(cloud(8_000, 5));

    expect(usePlayerStore.getState().progress.totalSteps).toBe(9_000);
    expect(usePlayerStore.getState().progress.streakDays).toBe(2);
  });

  it("prend le cloud quand il est en avance, et l'écrit en local", async () => {
    await usePlayerStore.getState().mergeCloudProgress(cloud(90_000, 7));
    expect(usePlayerStore.getState().progress.totalSteps).toBe(90_000);

    usePlayerStore.setState({ progress: { ...usePlayerStore.getState().progress, totalSteps: 0 } });
    await usePlayerStore.getState().hydrateLocalProgress("guts");
    expect(usePlayerStore.getState().progress.totalSteps).toBe(90_000);
  });
});

describe("sauvegarde cloud", () => {
  it("regroupe les écritures : une seule par période de 30 s", async () => {
    for (let steps = 100; steps <= 1000; steps += 100) {
      await usePlayerStore.getState().syncFromSteps(steps, 0, NEVER);
    }
    expect(saveToCloud).not.toHaveBeenCalled();

    jest.advanceTimersByTime(30_000);
    expect(saveToCloud).toHaveBeenCalledTimes(1);
    expect(saveToCloud.mock.calls[0][0]).toBe("guts");
    expect(saveToCloud.mock.calls[0][1].totalSteps).toBe(1000);
  });

  it("part tout de suite avec flushCloudSave", async () => {
    await usePlayerStore.getState().syncFromSteps(500, 0, NEVER);
    flushCloudSave();
    expect(saveToCloud).toHaveBeenCalledTimes(1);
  });

  it("n'écrit jamais la progression d'un compte dans celui d'un autre", async () => {
    await usePlayerStore.getState().syncFromSteps(500, 0, NEVER);
    signIn("casca");

    jest.advanceTimersByTime(30_000);
    expect(saveToCloud).not.toHaveBeenCalled();
  });
});
