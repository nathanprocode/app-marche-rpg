import { resolveCampScene, resolveCampTime } from "../campScene";

describe("resolveCampTime", () => {
  it("fait nuit de 20 h à 6 h", () => {
    expect(resolveCampTime(19)).toBe("day");
    expect(resolveCampTime(20)).toBe("night");
    expect(resolveCampTime(0)).toBe("night");
    expect(resolveCampTime(5)).toBe("night");
    expect(resolveCampTime(6)).toBe("day");
  });
});

describe("resolveCampScene", () => {
  it("change de phrase selon le moment et l'état de la Marque", () => {
    const lines = [7, 15, 22].flatMap((hour) =>
      [true, false].map((isCalm) => resolveCampScene(hour, isCalm, "Doldrey").line),
    );
    expect(new Set(lines).size).toBe(6);
  });

  it("cite le dernier point franchi", () => {
    [3, 9, 14, 21].forEach((hour) => {
      expect(resolveCampScene(hour, false, "La Chute de Doldrey").line).toContain("La Chute de Doldrey");
    });
  });

  it("montre Guts au repos la nuit, en marche le jour", () => {
    expect(resolveCampScene(23, true, "x").time).toBe("night");
    expect(resolveCampScene(10, true, "x").time).toBe("day");
  });
});
