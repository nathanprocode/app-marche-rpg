import { BOSS_ENCOUNTERS } from "../../../data/bosses";
import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { computeDuel, computeDuels, diffDuels, stepsAtKm, victoriousEncounterIds, victoryKey } from "../duel";

const ZODD_1 = BOSS_ENCOUNTERS[0];
const START = stepsAtKm(115);
const statusAt = (lapSteps: number) => computeDuel(ZODD_1, lapSteps, BERSERK_CHECKPOINTS);

describe("computeDuel", () => {
  it("reste fermé avant le checkpoint", () => {
    expect(statusAt(0).state).toBe("locked");
    expect(statusAt(START - 1).state).toBe("locked");
  });

  it("s'ouvre au checkpoint avec toute la vie de la forme humaine", () => {
    const status = statusAt(START);
    expect(status.state).toBe("active");
    expect(status.phase.id).toBe("human");
    expect(status.phaseHpLeft).toBe(10_000);
    expect(status.damage).toBe(0);
  });

  it("chaque pas retire un point de vie", () => {
    const status = statusAt(START + 2_500);
    expect(status.phaseHpLeft).toBe(7_500);
    expect(status.phaseHp).toBe(10_000);
  });

  it("passe à la forme d'Apôtre quand la forme humaine est vaincue", () => {
    const status = statusAt(START + 10_000);
    expect(status.state).toBe("active");
    expect(status.phase.id).toBe("apostle");
    expect(status.phaseHpLeft).toBe(20_000);
    expect(statusAt(START + 15_000).phaseHpLeft).toBe(15_000);
  });

  it("est gagné quand toute la vie est épuisée, et le reste", () => {
    expect(statusAt(START + 29_999).state).toBe("active");
    const won = statusAt(START + 30_000);
    expect(won.state).toBe("won");
    expect(won.phaseHpLeft).toBe(0);
    expect(statusAt(START + 500_000).state).toBe("won");
  });

  it("le second duel s'ouvre plus loin sur la route, avec plus de vie", () => {
    const duels = computeDuels(BOSS_ENCOUNTERS, stepsAtKm(590), BERSERK_CHECKPOINTS);
    expect(duels.map((duel) => duel.state)).toEqual(["won", "active"]);
    expect(duels[1].totalHp).toBe(60_000);
  });

  it("références des checkpoints existantes et formes cohérentes", () => {
    const ids = new Set(BERSERK_CHECKPOINTS.map((checkpoint) => checkpoint.id));
    BOSS_ENCOUNTERS.forEach((encounter) => {
      expect(ids).toContain(encounter.checkpointId);
      expect(encounter.phases.length).toBeGreaterThan(0);
      expect(encounter.phaseChangeTexts).toHaveLength(encounter.phases.length - 1);
      encounter.phases.forEach((phase) => expect(phase.hp).toBeGreaterThan(0));
    });
  });
});

describe("diffDuels", () => {
  const duelsAt = (lapSteps: number) => computeDuels(BOSS_ENCOUNTERS, lapSteps, BERSERK_CHECKPOINTS);

  it("signale le changement de forme", () => {
    const events = diffDuels(duelsAt(START + 9_990), duelsAt(START + 10_005), 1);
    expect(events).toEqual([{ type: "phase", encounterId: "zodd-1", phaseIndex: 1 }]);
  });

  it("signale la victoire, une seule fois", () => {
    const events = diffDuels(duelsAt(START + 29_990), duelsAt(START + 30_010), 2);
    expect(events).toEqual([{ type: "victory", encounterId: "zodd-1", lap: 2 }]);
    expect(diffDuels(duelsAt(START + 30_010), duelsAt(START + 30_100), 2)).toEqual([]);
  });

  it("ne signale que la victoire quand un saut traverse toutes les formes", () => {
    const events = diffDuels(duelsAt(START + 100), duelsAt(START + 40_000), 1);
    expect(events).toEqual([{ type: "victory", encounterId: "zodd-1", lap: 1 }]);
  });

  it("ne signale rien tant que le duel n'avance pas d'une forme", () => {
    expect(diffDuels(duelsAt(START + 100), duelsAt(START + 5_000), 1)).toEqual([]);
    expect(diffDuels(duelsAt(0), duelsAt(START + 5_000), 1)).toEqual([]);
  });
});

describe("victoires", () => {
  it("une clé par tour et par duel, les identifiants se lisent tous tours confondus", () => {
    expect(victoryKey(2, "zodd-1")).toBe("2/zodd-1");
    expect(victoriousEncounterIds({ "1/zodd-1": "a", "2/zodd-1": "b", "1/zodd-2": "c" }).sort()).toEqual(["zodd-1", "zodd-2"]);
  });
});
