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

  it("Gambino n'est là qu'entre L'Ombre de Gambino et Le Briseur d'Ours", () => {
    expect(travelingAt(18)).toEqual(["gambino"]);
    expect(travelingAt(51.9)).toEqual(["gambino"]);
    expect(travelingAt(52)).toEqual([]);
  });

  it("la Troupe du Faucon le rejoint à La Rencontre avec le Faucon", () => {
    expect(travelingAt(85)).toEqual(["casca", "griffith", "judeau", "pippin", "rickert"]);
  });

  it("Zodd rôde à Nosferatu Zodd, juste avant La Chute de Doldrey", () => {
    expect(travelingAt(115)).toEqual(["casca", "griffith", "judeau", "pippin", "rickert", "zodd"]);
    expect(travelingAt(142)).toEqual(["casca", "griffith", "judeau", "pippin", "rickert"]);
  });

  it("tous quittent Guts au Départ sous la Neige", () => {
    expect(travelingAt(189.9)).toContain("griffith");
    expect(travelingAt(190)).toEqual([]);
  });

  it("les Faucons reviennent pour la Tour des Renaissances, puis disparaissent à L'Éclipse", () => {
    expect(travelingAt(250)).toEqual(["judeau", "pippin", "rickert"]);
    expect(travelingAt(314.9)).toEqual(["judeau", "pippin", "rickert"]);
    expect(travelingAt(315)).toEqual(["skullknight"]);
  });

  it("Rickert retrouve Guts à la Forge de Godo ; Godo et Flora restent chez eux", () => {
    expect(travelingAt(384)).toContain("rickert");
    expect(travelingAt(384)).not.toContain("godo");
    expect(travelingAt(460)).not.toContain("rickert");
    expect(travelingAt(700)).not.toContain("flora");
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
    expect(getCompanionsMetAt("cp-004", COMPANIONS).map((companion) => companion.id)).toEqual([
      "casca",
      "griffith",
      "judeau",
      "pippin",
      "rickert",
    ]);
    expect(getCompanionsMetAt("cp-002", COMPANIONS).map((companion) => companion.id)).toEqual(["gambino"]);
    expect(getCompanionsMetAt("cp-003", COMPANIONS)).toEqual([]);
  });
});

describe("COMPANIONS", () => {
  it("ont des identifiants uniques et sont rangés dans l'ordre de rencontre", () => {
    const ids = COMPANIONS.map((companion) => companion.id);
    expect(new Set(ids).size).toBe(ids.length);

    const km = (id: string) => BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === id)!.kmThreshold;
    const meetKms = COMPANIONS.map((companion) => km(companion.metAtCheckpointId));
    expect(meetKms).toEqual([...meetKms].sort((a, b) => a - b));
  });

  it("ne marchent avec Guts qu'après l'avoir rencontré", () => {
    const km = (id: string) => BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === id)!.kmThreshold;
    COMPANIONS.forEach((companion) => {
      companion.travels.forEach((travel) => {
        expect(km(travel.fromCheckpointId)).toBeGreaterThanOrEqual(km(companion.metAtCheckpointId));
      });
    });
  });

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
