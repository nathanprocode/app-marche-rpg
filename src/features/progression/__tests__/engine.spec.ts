import { buildProgressFromSteps, computeGlobalProgressPct, deriveBrandState } from "../engine";

const NEVER = new Date(0).toISOString();

describe("computeGlobalProgressPct", () => {
  it("vaut 0 au départ et 100 à l'arrivée", () => {
    expect(computeGlobalProgressPct(0)).toBe(0);
    expect(computeGlobalProgressPct(1000)).toBe(100);
    expect(computeGlobalProgressPct(2500)).toBe(100);
  });
});

describe("deriveBrandState", () => {
  it("saigne sous le seuil de pas du jour", () => {
    expect(deriveBrandState(0)).toBe("bleeding");
    expect(deriveBrandState(1499)).toBe("bleeding");
  });

  it("est apaisée dès le seuil atteint", () => {
    expect(deriveBrandState(1500)).toBe("active");
  });
});

describe("buildProgressFromSteps", () => {
  it("convertit les pas en distance (0,75 m par pas)", () => {
    const progress = buildProgressFromSteps(10_000, 3, NEVER);
    expect(progress.totalSteps).toBe(10_000);
    expect(progress.totalDistanceKm).toBeCloseTo(7.5, 5);
    expect(progress.streakDays).toBe(3);
  });

  it("dérive l'état de la Marque des pas du jour, pas du total (régression)", () => {
    expect(buildProgressFromSteps(500_000, 0, NEVER, 0).brandState).toBe("bleeding");
    expect(buildProgressFromSteps(100, 0, NEVER, 2000).brandState).toBe("active");
  });
});
