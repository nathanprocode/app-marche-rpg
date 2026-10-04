import {
  formatGroupCode,
  freshnessLabel,
  generateGroupCode,
  normalizeGroupCode,
  parseBandMember,
  rankMembers,
  type BandMember,
} from "../band";

const member = (uid: string, over: Partial<BandMember> = {}): BandMember => ({
  uid,
  displayName: uid,
  lap: 1,
  totalDistanceKm: 10,
  streakDays: 0,
  updatedAtISO: "2026-10-04T10:00:00.000Z",
  ...over,
});

describe("code de groupe", () => {
  it("génère 6 caractères lisibles, sans I, O, 0 ni 1", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateGroupCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    }
  });

  it("accepte le code avec ou sans préfixe, en minuscules, avec des espaces", () => {
    expect(normalizeGroupCode("faucon-k7m2qx")).toBe("K7M2QX");
    expect(normalizeGroupCode(" K7M2QX ")).toBe("K7M2QX");
    expect(normalizeGroupCode("FAUCON K7M2QX")).toBe("K7M2QX");
  });

  it("refuse un code trop court, trop long ou avec un caractère ambigu", () => {
    expect(normalizeGroupCode("K7M2Q")).toBeNull();
    expect(normalizeGroupCode("K7M2QXX")).toBeNull();
    expect(normalizeGroupCode("K7M2Q0")).toBeNull();
    expect(normalizeGroupCode("")).toBeNull();
  });

  it("affiche le code avec son préfixe", () => {
    expect(formatGroupCode("K7M2QX")).toBe("FAUCON-K7M2QX");
  });
});

describe("parseBandMember", () => {
  it("relit un document correct", () => {
    expect(parseBandMember("u1", { displayName: "Casca", lap: 2, totalDistanceKm: 12.5, streakDays: 4, updatedAtISO: "x" })).toEqual({
      uid: "u1",
      displayName: "Casca",
      lap: 2,
      totalDistanceKm: 12.5,
      streakDays: 4,
      updatedAtISO: "x",
    });
  });

  it("rejette un document sans nom ou sans distance, et corrige le reste", () => {
    expect(parseBandMember("u1", null)).toBeNull();
    expect(parseBandMember("u1", { displayName: "", totalDistanceKm: 3 })).toBeNull();
    expect(parseBandMember("u1", { displayName: "A", totalDistanceKm: "abc" })).toBeNull();
    expect(parseBandMember("u1", { displayName: "A", totalDistanceKm: 3, lap: -2, streakDays: "x" })).toMatchObject({
      lap: 1,
      streakDays: 0,
    });
  });
});

describe("rankMembers", () => {
  it("classe par tour puis par distance, puis par nom", () => {
    const ranked = rankMembers([
      member("b", { totalDistanceKm: 50 }),
      member("a", { totalDistanceKm: 50 }),
      member("c", { totalDistanceKm: 5, lap: 2 }),
      member("d", { totalDistanceKm: 90 }),
    ]);
    expect(ranked.map((m) => m.uid)).toEqual(["c", "d", "a", "b"]);
  });

  it("remplace ta ligne du cloud par ton état local", () => {
    const ranked = rankMembers([member("me", { totalDistanceKm: 10 }), member("x", { totalDistanceKm: 20 })], member("me", { totalDistanceKm: 30 }));
    expect(ranked.map((m) => [m.uid, m.totalDistanceKm])).toEqual([["me", 30], ["x", 20]]);
  });
});

describe("freshnessLabel", () => {
  const now = new Date("2026-10-04T12:00:00.000Z");
  it("exprime l'ancienneté simplement", () => {
    expect(freshnessLabel("2026-10-04T11:59:30.000Z", now)).toBe("à l'instant");
    expect(freshnessLabel("2026-10-04T11:48:00.000Z", now)).toBe("il y a 12 min");
    expect(freshnessLabel("2026-10-04T09:00:00.000Z", now)).toBe("il y a 3 h");
    expect(freshnessLabel("2026-10-02T12:00:00.000Z", now)).toBe("il y a 2 j");
  });
});
