import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../../data/map/berserk-checkpoints";
import { calculateGutsPosition, interpolatePoint } from "../interpolation";

function checkpoint(id: string, kmThreshold: number, x: number, y: number): BerserkCheckpoint {
  return { id, kmThreshold, x, y, arc: "", title: id, description: "", icon: "" };
}

const A = checkpoint("a", 0, 0, 0);
const B = checkpoint("b", 100, 100, 50);
const C = checkpoint("c", 300, 0, 50);

describe("interpolatePoint", () => {
  it("borne la progression entre 0 et 100 %", () => {
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 50)).toEqual({ x: 5, y: 10 });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, -20)).toEqual({ x: 0, y: 0 });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 150)).toEqual({ x: 10, y: 20 });
  });
});

describe("calculateGutsPosition", () => {
  it("refuse moins de 2 checkpoints", () => {
    expect(() => calculateGutsPosition(10, [A])).toThrow();
  });

  it("reste sur le premier checkpoint au départ", () => {
    const position = calculateGutsPosition(0, [A, B, C]);
    expect(position.previous.id).toBe("a");
    expect(position.next.id).toBe("b");
    expect(position.segmentProgressPct).toBe(0);
    expect({ x: position.x, y: position.y }).toEqual({ x: 0, y: 0 });
  });

  it("place le Traqué au prorata sur le segment en cours", () => {
    const position = calculateGutsPosition(200, [A, B, C]);
    expect(position.previous.id).toBe("b");
    expect(position.next.id).toBe("c");
    expect(position.segmentProgressPct).toBeCloseTo(50, 5);
    expect(position.x).toBeCloseTo(50, 5);
    expect(position.y).toBeCloseTo(50, 5);
  });

  it("passe au segment suivant pile sur un checkpoint", () => {
    const position = calculateGutsPosition(100, [A, B, C]);
    expect(position.previous.id).toBe("b");
    expect(position.segmentProgressPct).toBe(0);
  });

  it("s'arrête sur le dernier checkpoint au-delà de l'objectif", () => {
    const position = calculateGutsPosition(5000, [A, B, C]);
    expect(position.previous.id).toBe("c");
    expect(position.next.id).toBe("c");
    expect(position.segmentProgressPct).toBe(100);
  });

  it("ne dépend pas de l'ordre des checkpoints", () => {
    expect(calculateGutsPosition(200, [C, A, B])).toEqual(calculateGutsPosition(200, [A, B, C]));
  });
});

describe("BERSERK_CHECKPOINTS", () => {
  it("part de 0 km, finit à 1 000 km, avec des seuils strictement croissants", () => {
    const kms = BERSERK_CHECKPOINTS.map((cp) => cp.kmThreshold);
    expect(kms[0]).toBe(0);
    expect(kms[kms.length - 1]).toBe(1000);
    kms.slice(1).forEach((km, i) => expect(km).toBeGreaterThan(kms[i]));
  });

  it("a des identifiants uniques et des positions dans la carte (0 à 100)", () => {
    const ids = BERSERK_CHECKPOINTS.map((cp) => cp.id);
    expect(new Set(ids).size).toBe(ids.length);
    BERSERK_CHECKPOINTS.forEach((cp) => {
      expect(cp.x).toBeGreaterThanOrEqual(0);
      expect(cp.x).toBeLessThanOrEqual(100);
      expect(cp.y).toBeGreaterThanOrEqual(0);
      expect(cp.y).toBeLessThanOrEqual(100);
    });
  });
});
