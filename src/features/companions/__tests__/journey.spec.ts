import { COMPANIONS } from "../../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { getCompanionsMetAt, getTravelingCompanions, isCompanionMet, layoutTroupe } from "../journey";

const travelingAt = (km: number) =>
  getTravelingCompanions(km, COMPANIONS, BERSERK_CHECKPOINTS).map((companion) => companion.id);

describe("getTravelingCompanions", () => {
  it("Guts marche seul au départ", () => {
    expect(travelingAt(0)).toEqual([]);
    expect(travelingAt(84.9)).toEqual([]);
  });

  it("Casca et Griffith le rejoignent à La Rencontre avec le Faucon", () => {
    expect(travelingAt(85)).toEqual(["casca", "griffith"]);
  });

  it("ils le quittent au Départ sous la Neige", () => {
    expect(travelingAt(189.9)).toEqual(["casca", "griffith"]);
    expect(travelingAt(190)).toEqual([]);
  });

  it("le Chevalier Squelette n'apparaît qu'entre L'Éclipse et Le Comte", () => {
    expect(travelingAt(320)).toEqual(["skullknight"]);
    expect(travelingAt(350)).toEqual([]);
  });

  it("Casca revient à La Tour d'Albion avec la nouvelle troupe", () => {
    expect(travelingAt(545)).toEqual(["casca", "isidro", "farnese", "serpico"]);
  });

  it("toute la troupe finit la Traque avec Guts", () => {
    expect(travelingAt(1000)).toEqual(["casca", "isidro", "farnese", "serpico", "schierke"]);
    expect(travelingAt(5000)).toEqual(["casca", "isidro", "farnese", "serpico", "schierke"]);
  });
});

describe("isCompanionMet", () => {
  it("dépend du checkpoint de rencontre, pas de la présence sur la carte", () => {
    const griffith = COMPANIONS.find((companion) => companion.id === "griffith")!;
    expect(isCompanionMet(griffith, ["cp-001", "cp-002", "cp-003"])).toBe(false);
    // Il a quitté Guts au cp-006, mais reste dans la collection.
    expect(isCompanionMet(griffith, ["cp-004", "cp-005", "cp-006"])).toBe(true);
  });
});

describe("getCompanionsMetAt", () => {
  it("liste les compagnons rencontrés à un checkpoint", () => {
    expect(getCompanionsMetAt("cp-004", COMPANIONS).map((companion) => companion.id)).toEqual(["casca", "griffith"]);
    expect(getCompanionsMetAt("cp-002", COMPANIONS)).toEqual([]);
  });
});

describe("COMPANIONS", () => {
  it("ne référence que des checkpoints existants", () => {
    const ids = new Set(BERSERK_CHECKPOINTS.map((checkpoint) => checkpoint.id));
    COMPANIONS.forEach((companion) => {
      expect(ids).toContain(companion.metAtCheckpointId);
      companion.travels.forEach((travel) => {
        expect(ids).toContain(travel.fromCheckpointId);
        if (travel.untilCheckpointId) expect(ids).toContain(travel.untilCheckpointId);
      });
    });
  });

});

describe("layoutTroupe", () => {
  const HALF = 22;

  it("alterne gauche et droite au milieu de la carte", () => {
    expect(layoutTroupe(3, 500, 500, HALF)).toEqual([-52, 52, -86]);
  });

  it("passe tout le monde à droite près du bord gauche (Elfhelm)", () => {
    const offsets = layoutTroupe(5, 78, 1200, HALF);
    expect(offsets).toEqual([52, 86, 120, 154, 188]);
  });

  it("passe tout le monde à gauche près du bord droit", () => {
    expect(layoutTroupe(2, 1200, 40, HALF)).toEqual([-52, -86]);
  });

  it("ne superpose jamais deux compagnons ni ne touche Guts", () => {
    [[500, 500], [78, 1200], [1200, 78]].forEach(([left, right]) => {
      const offsets = layoutTroupe(5, left, right, HALF);
      expect(new Set(offsets).size).toBe(5);
      offsets.forEach((x) => expect(Math.abs(x)).toBeGreaterThanOrEqual(52));
    });
  });

  it("ne renvoie rien sans compagnon", () => {
    expect(layoutTroupe(0, 10, 10, HALF)).toEqual([]);
  });
});
