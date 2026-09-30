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

describe("checkpoints de la Traque", () => {
  it("place un joueur qui débute sur le premier checkpoint", () => {
    const progress = buildProgressFromSteps(0, 0, NEVER);
    expect(progress.currentCheckpointId).toBe("cp-001");
    expect(progress.currentSegmentProgressPct).toBe(0);
  });

  it("place 61,4 km entre le Briseur d'Ours (52 km) et la Rencontre avec le Faucon (85 km)", () => {
    const progress = buildProgressFromSteps(81_866, 12, NEVER);
    expect(progress.totalDistanceKm).toBeCloseTo(61.4, 1);
    expect(progress.currentCheckpointId).toBe("cp-003");
    expect(progress.currentSegmentProgressPct).toBeCloseTo(28.5, 0);
  });

  it("termine sur le dernier checkpoint à 1000 km", () => {
    const progress = buildProgressFromSteps(1_400_000, 0, NEVER);
    expect(progress.currentCheckpointId).toBe("cp-015");
    expect(progress.currentSegmentProgressPct).toBe(100);
    expect(progress.progressPct).toBe(100);
  });
});
