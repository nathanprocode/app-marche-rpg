import { BOSS_ENCOUNTERS } from "../bosses";
import { ENEMIES, enemyStatus } from "../enemies";
import { BERSERK_CHECKPOINTS } from "../map/berserk-checkpoints";

describe("bestiaire", () => {
  it("chaque ennemi pointe vers un checkpoint et des duels qui existent", () => {
    const checkpointIds = new Set(BERSERK_CHECKPOINTS.map((checkpoint) => checkpoint.id));
    const encounterIds = new Set(BOSS_ENCOUNTERS.map((encounter) => encounter.id));
    ENEMIES.forEach((enemy) => {
      expect(checkpointIds).toContain(enemy.metAtCheckpointId);
      expect(enemy.forms.length).toBeGreaterThan(0);
      expect(enemy.encounterIds.length).toBeGreaterThan(0);
      enemy.encounterIds.forEach((id) => expect(encounterIds).toContain(id));
    });
  });

  it("tous les duels du jeu ont leur ennemi, et aucun n'est compté deux fois", () => {
    const listed = ENEMIES.flatMap((enemy) => enemy.encounterIds).sort();
    expect(listed).toEqual(BOSS_ENCOUNTERS.map((encounter) => encounter.id).sort());
  });

  it("les identifiants sont uniques", () => {
    const ids = ENEMIES.map((enemy) => enemy.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("enemyStatus", () => {
  const zodd = ENEMIES.find((enemy) => enemy.id === "zodd")!;

  it("est inconnu tant que son checkpoint n'est pas franchi", () => {
    expect(enemyStatus(zodd, ["cp-001"], [])).toBe("unknown");
  });

  it("est rencontré une fois le checkpoint franchi, vaincu quand tous ses duels sont gagnés", () => {
    expect(enemyStatus(zodd, ["cp-004-5"], [])).toBe("met");
    expect(enemyStatus(zodd, ["cp-004-5"], ["zodd-1"])).toBe("met");
    expect(enemyStatus(zodd, ["cp-004-5"], ["zodd-1", "zodd-2"])).toBe("defeated");
  });
});
