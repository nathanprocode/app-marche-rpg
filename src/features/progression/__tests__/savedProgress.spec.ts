import { parseSavedProgress, pickSavedProgress, type SavedProgress } from "../savedProgress";

function saved(overrides: Partial<SavedProgress> = {}): SavedProgress {
  return {
    totalSteps: 1000,
    streakDays: 2,
    lastActiveDateISO: "2026-09-30T10:00:00.000Z",
    unlockedCheckpoints: ["cp-001"],
    updatedAtISO: "2026-09-30T10:00:00.000Z",
    ...overrides,
  };
}

describe("pickSavedProgress", () => {
  it("prend celle qui existe quand l'autre manque", () => {
    expect(pickSavedProgress(null, null)).toBeNull();
    expect(pickSavedProgress(saved(), null)).toEqual(saved());
    expect(pickSavedProgress(null, saved({ totalSteps: 5 }))?.totalSteps).toBe(5);
  });

  it("garde le local quand il a plus de pas (écritures cloud manquées hors ligne)", () => {
    const result = pickSavedProgress(saved({ totalSteps: 9000, streakDays: 4 }), saved({ totalSteps: 8000 }));
    expect(result?.totalSteps).toBe(9000);
    expect(result?.streakDays).toBe(4);
  });

  it("prend le cloud quand il a plus de pas (réinstallation, autre téléphone)", () => {
    const result = pickSavedProgress(saved({ totalSteps: 10 }), saved({ totalSteps: 90_000, streakDays: 7 }));
    expect(result?.totalSteps).toBe(90_000);
    expect(result?.streakDays).toBe(7);
  });

  it("garde le local à égalité", () => {
    const result = pickSavedProgress(saved({ streakDays: 3 }), saved({ streakDays: 1 }));
    expect(result?.streakDays).toBe(3);
  });

  it("réunit les checkpoints débloqués des deux côtés", () => {
    const result = pickSavedProgress(
      saved({ totalSteps: 9000, unlockedCheckpoints: ["cp-001", "cp-002"] }),
      saved({ unlockedCheckpoints: ["cp-001", "cp-003"] }),
    );
    expect(result?.unlockedCheckpoints.sort()).toEqual(["cp-001", "cp-002", "cp-003"]);
  });
});

describe("parseSavedProgress", () => {
  it("rejette ce qui n'est pas un objet", () => {
    expect(parseSavedProgress(null)).toBeNull();
    expect(parseSavedProgress("1000")).toBeNull();
  });

  it("répare les champs absents ou invalides", () => {
    const result = parseSavedProgress({ totalSteps: -3, streakDays: "x", lastActiveDateISO: "pas une date" });
    expect(result).toEqual({
      totalSteps: 0,
      streakDays: 0,
      lastActiveDateISO: new Date(0).toISOString(),
      unlockedCheckpoints: [],
      updatedAtISO: new Date(0).toISOString(),
    });
  });

  it("relit une sauvegarde valide telle quelle", () => {
    expect(parseSavedProgress(saved())).toEqual(saved());
  });
});
