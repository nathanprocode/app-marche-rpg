import { computeDayDiff, computeDayState, computeNextStreak } from "../streakEngine";

const MIN_STEPS = 1500;
const NEVER = new Date(0).toISOString();

/** Date locale à midi, pour que les tests ne dépendent pas du fuseau de la machine. */
function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

describe("computeDayDiff", () => {
  it("compte les jours calendaires locaux", () => {
    expect(computeDayDiff(at(2026, 5, 1, 10), at(2026, 5, 3, 10))).toBe(2);
  });

  it("compte 1 jour entre 23h et 1h le lendemain", () => {
    expect(computeDayDiff(at(2026, 5, 1, 23), at(2026, 5, 2, 1))).toBe(1);
  });

  it("compte 0 jour dans la même journée", () => {
    expect(computeDayDiff(at(2026, 5, 1, 0), at(2026, 5, 1, 23))).toBe(0);
  });
});

describe("computeNextStreak", () => {
  it("incrémente la série pour un jour actif consécutif", () => {
    expect(computeNextStreak(4, at(2026, 5, 2), at(2026, 5, 3), 2000, MIN_STEPS)).toBe(5);
  });

  it("ne change rien tant que le seuil n'est pas atteint", () => {
    expect(computeNextStreak(4, at(2026, 5, 2), at(2026, 5, 3), 900, MIN_STEPS)).toBe(4);
  });

  it("repart à 1 après un jour manqué", () => {
    expect(computeNextStreak(4, at(2026, 5, 1), at(2026, 5, 3), 2000, MIN_STEPS)).toBe(1);
  });

  it("ne compte pas deux fois la même journée", () => {
    expect(computeNextStreak(4, at(2026, 5, 3, 8), at(2026, 5, 3, 20), 4000, MIN_STEPS)).toBe(4);
  });
});

describe("computeDayState", () => {
  const base = { minStepsForActiveDay: MIN_STEPS };

  it("valide la journée dès que le seuil est atteint", () => {
    const day = computeDayState({ ...base, streakDays: 2, lastActiveDateISO: at(2026, 5, 2), stepsToday: 1500, nowISO: at(2026, 5, 3) });
    expect(day.activeToday).toBe(true);
    expect(day.streakDays).toBe(3);
    expect(day.sedentaryDays).toBe(0);
    expect(computeDayDiff(day.lastActiveDateISO, at(2026, 5, 3))).toBe(0);
  });

  it("est idempotent : rappeler le calcul plus tard le même jour ne change rien", () => {
    const first = computeDayState({ ...base, streakDays: 2, lastActiveDateISO: at(2026, 5, 2), stepsToday: 2000, nowISO: at(2026, 5, 3, 9) });
    const again = computeDayState({
      ...base,
      streakDays: first.streakDays,
      lastActiveDateISO: first.lastActiveDateISO,
      stepsToday: 6000,
      nowISO: at(2026, 5, 3, 21),
    });
    expect(again.streakDays).toBe(first.streakDays);
    expect(again.lastActiveDateISO).toBe(first.lastActiveDateISO);
  });

  it("ne compte pas la journée en cours comme sédentaire", () => {
    const day = computeDayState({ ...base, streakDays: 5, lastActiveDateISO: at(2026, 5, 2), stepsToday: 200, nowISO: at(2026, 5, 3) });
    expect(day.activeToday).toBe(false);
    expect(day.sedentaryDays).toBe(0);
    expect(day.streakDays).toBe(5);
  });

  it("compte les jours entiers manqués", () => {
    const day = computeDayState({ ...base, streakDays: 5, lastActiveDateISO: at(2026, 5, 1), stepsToday: 0, nowISO: at(2026, 5, 4) });
    expect(day.sedentaryDays).toBe(2);
  });

  it("ne rend pas un nouveau joueur sédentaire", () => {
    const day = computeDayState({ ...base, streakDays: 0, lastActiveDateISO: NEVER, stepsToday: 0, nowISO: at(2026, 5, 3) });
    expect(day.sedentaryDays).toBe(0);
  });
});
