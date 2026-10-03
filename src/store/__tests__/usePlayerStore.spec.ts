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
  return {
    totalSteps,
    streakDays,
    lastActiveDateISO: NEVER,
    unlockedCheckpoints: [],
    updatedAtISO: NEVER,
    lap: 1,
    lapStartSteps: 0,
    bestStreak: streakDays,
    bestDaySteps: 0,
    achievements: {},
  };
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

const STEPS_FOR_THE_TRAQUE = 1_333_334; // 1 000 km à 0,75 m par pas

describe("tours de Traque", () => {
  it("ne démarre pas un nouveau tour avant l'arrivée", async () => {
    await usePlayerStore.getState().syncFromSteps(10_000, 0, NEVER);
    await usePlayerStore.getState().startNextLap();
    expect(usePlayerStore.getState().progress.lap).toBe(1);
  });

  it("repart de zéro à l'arrivée en reportant les pas en trop", async () => {
    await usePlayerStore.getState().syncFromSteps(STEPS_FOR_THE_TRAQUE + 5_000, 0, NEVER);
    await usePlayerStore.getState().startNextLap();

    const { progress } = usePlayerStore.getState();
    expect(progress.lap).toBe(2);
    expect(progress.totalSteps).toBe(STEPS_FOR_THE_TRAQUE + 5_000);
    expect(progress.lapSteps).toBe(5_000);
    expect(progress.totalDistanceKm).toBeCloseTo(3.75, 5);
  });

  it("garde chroniques et succès, et envoie le nouveau tour au cloud tout de suite", async () => {
    await usePlayerStore.getState().syncFromSteps(STEPS_FOR_THE_TRAQUE, 0, NEVER);
    saveToCloud.mockClear();
    await usePlayerStore.getState().startNextLap();

    expect(usePlayerStore.getState().unlockedCheckpoints).toContain("cp-015");
    expect(usePlayerStore.getState().achievements["lap-1"]).toBeDefined();
    expect(saveToCloud).toHaveBeenCalledTimes(1);
    expect(saveToCloud.mock.calls[0][4]).toMatchObject({ achievements: expect.objectContaining({ "lap-1": expect.any(String) }) });
  });

  it("relit le tour après un redémarrage", async () => {
    await usePlayerStore.getState().syncFromSteps(STEPS_FOR_THE_TRAQUE + 100, 0, NEVER);
    await usePlayerStore.getState().startNextLap();
    usePlayerStore.setState({ progress: { ...usePlayerStore.getState().progress, lap: 1, lapStartSteps: 0 } });

    await usePlayerStore.getState().hydrateLocalProgress("guts");
    expect(usePlayerStore.getState().progress.lap).toBe(2);
    expect(usePlayerStore.getState().progress.lapSteps).toBe(100);
  });
});

describe("records et succès", () => {
  it("débloquent un succès et le signalent une seule fois", async () => {
    await usePlayerStore.getState().syncFromSteps(14_000, 0, NEVER); // ≈ 10,5 km
    expect(usePlayerStore.getState().newAchievementIds).toEqual(["km-10"]);

    await usePlayerStore.getState().syncFromSteps(15_000, 0, NEVER);
    expect(usePlayerStore.getState().newAchievementIds).toEqual(["km-10"]);

    usePlayerStore.getState().clearNewAchievements();
    expect(usePlayerStore.getState().newAchievementIds).toEqual([]);
  });

  it("garde la meilleure série même quand la série retombe", async () => {
    await usePlayerStore.getState().syncFromSteps(1_000, 8, NEVER);
    await usePlayerStore.getState().syncFromSteps(1_100, 1, NEVER);
    expect(usePlayerStore.getState().bestStreak).toBe(8);
  });

  it("rattrape les succès déjà mérités au chargement sans les annoncer", async () => {
    await usePlayerStore.getState().mergeCloudProgress(cloud(200_000, 4));
    expect(usePlayerStore.getState().achievements["km-100"]).toBeDefined();
    expect(usePlayerStore.getState().newAchievementIds).toEqual([]);
  });
});
