import { ACHIEVEMENTS, findNewAchievements, getAchievement, isAchievementEarned, type AchievementStats } from "../achievements";

function stats(overrides: Partial<AchievementStats> = {}): AchievementStats {
  return {
    lifetimeKm: 0,
    bestStreak: 0,
    bestDaySteps: 0,
    checkpointsUnlocked: 1,
    checkpointsTotal: 18,
    companionsMet: 0,
    companionsTotal: 7,
    lapsCompleted: 0,
    bossesDefeated: [],
    ...overrides,
  };
}

describe("succès", () => {
  it("ont des identifiants uniques", () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("n'en débloquent aucun au départ", () => {
    expect(findNewAchievements(stats(), {})).toEqual([]);
  });

  it("débloquent par distance, série et pas du jour", () => {
    const ids = findNewAchievements(stats({ lifetimeKm: 60, bestStreak: 7, bestDaySteps: 10_000 }), {});
    expect(ids).toEqual(
      expect.arrayContaining(["km-10", "km-50", "streak-3", "streak-7", "day-5000", "day-10000"]),
    );
    expect(ids).not.toContain("km-100");
    expect(ids).not.toContain("streak-14");
  });

  it("ne redonnent pas un succès déjà débloqué", () => {
    const unlocked = { "km-10": "2026-10-01T00:00:00.000Z" };
    expect(findNewAchievements(stats({ lifetimeKm: 12 }), unlocked)).toEqual([]);
  });

  it("suivent les collections et les tours", () => {
    const done = stats({ companionsMet: 7, checkpointsUnlocked: 18, lapsCompleted: 1 });
    expect(isAchievementEarned(getAchievement("companions-all")!, done)).toBe(true);
    expect(isAchievementEarned(getAchievement("chronicles-all")!, done)).toBe(true);
    expect(isAchievementEarned(getAchievement("lap-1")!, done)).toBe(true);
    expect(isAchievementEarned(getAchievement("lap-3")!, done)).toBe(false);
  });

  it("débloquent les succès de boss selon les duels gagnés", () => {
    const stats1 = stats({ bossesDefeated: ["zodd-1"] });
    expect(isAchievementEarned(getAchievement("boss-zodd-1")!, stats1)).toBe(true);
    expect(isAchievementEarned(getAchievement("boss-zodd-2")!, stats1)).toBe(false);
  });

  it("donnent l'avancement des succès verrouillés", () => {
    expect(getAchievement("km-100")!.progress(stats({ lifetimeKm: 40 }))).toEqual({ value: 40, target: 100 });
  });
});
