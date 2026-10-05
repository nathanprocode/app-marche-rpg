import { GUTS_SKINS } from "../../../data/gutsSkins";
import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { isSkinUnlocked, resolveGutsSkin, unlockedSkins } from "../gutsSkin";

const young = GUTS_SKINS.find((skin) => skin.id === "young")!;
const blackSwordsman = GUTS_SKINS.find((skin) => skin.id === "black-swordsman")!;

describe("skins de Guts", () => {
  it("Guts jeune est disponible dès le départ, le Guerrier Noir à l'Éclipse (315 km)", () => {
    expect(isSkinUnlocked(young, { lap: 1, totalDistanceKm: 0 }, BERSERK_CHECKPOINTS)).toBe(true);
    expect(isSkinUnlocked(blackSwordsman, { lap: 1, totalDistanceKm: 314.9 }, BERSERK_CHECKPOINTS)).toBe(false);
    expect(isSkinUnlocked(blackSwordsman, { lap: 1, totalDistanceKm: 315 }, BERSERK_CHECKPOINTS)).toBe(true);
  });

  it("reste débloqué aux tours suivants, même revenu à 0 km", () => {
    expect(unlockedSkins(GUTS_SKINS, { lap: 2, totalDistanceKm: 0 }, BERSERK_CHECKPOINTS).map((skin) => skin.id)).toEqual([
      "young",
      "black-swordsman",
    ]);
  });

  it("impose Guts jeune avant la première Éclipse, quel que soit le choix", () => {
    const progress = { lap: 1, totalDistanceKm: 120 };
    expect(resolveGutsSkin(GUTS_SKINS, null, progress, BERSERK_CHECKPOINTS).id).toBe("young");
    expect(resolveGutsSkin(GUTS_SKINS, "black-swordsman", progress, BERSERK_CHECKPOINTS).id).toBe("young");
  });

  it("passe au Guerrier Noir après l'Éclipse, sauf si on a choisi Guts jeune", () => {
    const progress = { lap: 1, totalDistanceKm: 400 };
    expect(resolveGutsSkin(GUTS_SKINS, null, progress, BERSERK_CHECKPOINTS).id).toBe("black-swordsman");
    expect(resolveGutsSkin(GUTS_SKINS, "young", progress, BERSERK_CHECKPOINTS).id).toBe("young");
  });

  it("garde le skin choisi au tour suivant, et ignore un choix inconnu", () => {
    const progress = { lap: 2, totalDistanceKm: 10 };
    expect(resolveGutsSkin(GUTS_SKINS, "young", progress, BERSERK_CHECKPOINTS).id).toBe("young");
    expect(resolveGutsSkin(GUTS_SKINS, "black-swordsman", progress, BERSERK_CHECKPOINTS).id).toBe("black-swordsman");
    expect(resolveGutsSkin(GUTS_SKINS, "inconnu", progress, BERSERK_CHECKPOINTS).id).toBe("black-swordsman");
  });

  it("chaque skin débloqué par un checkpoint vise un checkpoint qui existe", () => {
    GUTS_SKINS.forEach((skin) => {
      if (skin.unlock.type !== "checkpoint") return;
      const { checkpointId } = skin.unlock;
      expect(BERSERK_CHECKPOINTS.some((checkpoint) => checkpoint.id === checkpointId)).toBe(true);
    });
  });
});
