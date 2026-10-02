import { clampOffset, clampScale, containSize, distanceBetween, pinchScale, toggleScale } from "../zoomMath";

const SIZE = { width: 300, height: 400 };

describe("clampScale", () => {
  it("reste entre 1 et 4", () => {
    expect(clampScale(0.5)).toBe(1);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(9)).toBe(4);
  });
});

describe("pinchScale", () => {
  it("double quand les doigts s'écartent deux fois plus", () => {
    expect(pinchScale(1, 100, 200)).toBe(2);
    expect(pinchScale(2, 100, 150)).toBe(3);
  });

  it("ne descend pas sous la taille normale et ne dépasse pas le maximum", () => {
    expect(pinchScale(1, 200, 50)).toBe(1);
    expect(pinchScale(3, 100, 400)).toBe(4);
  });

  it("ignore un écart de départ nul", () => {
    expect(pinchScale(2, 0, 120)).toBe(2);
  });
});

describe("containSize", () => {
  it("fait tenir l'image entière dans le cadre", () => {
    // Planche paysage 1000 x 500 dans un cadre portrait 300 x 400 : 300 x 150, avec des bandes en haut et en bas.
    expect(containSize({ width: 1000, height: 500 }, SIZE)).toEqual({ width: 300, height: 150 });
  });

  it("prend le cadre entier si la taille de l'image est inconnue", () => {
    expect(containSize({ width: 0, height: 0 }, SIZE)).toEqual(SIZE);
  });
});

describe("clampOffset", () => {
  it("garde l'image centrée à la taille normale", () => {
    expect(clampOffset({ x: 80, y: -50 }, 1, SIZE, SIZE)).toEqual({ x: 0, y: 0 });
  });

  it("laisse aller jusqu'aux bords de l'image agrandie, pas au-delà", () => {
    // Échelle 2 : l'image fait 600 x 800, on peut la décaler de 150 et 200 au plus.
    expect(clampOffset({ x: 100, y: -100 }, 2, SIZE, SIZE)).toEqual({ x: 100, y: -100 });
    expect(clampOffset({ x: 500, y: -500 }, 2, SIZE, SIZE)).toEqual({ x: 150, y: -200 });
  });

  it("ne déplace pas dans les bandes vides d'une planche paysage", () => {
    // 300 x 150 à l'échelle 2 : 600 x 300, plus large que le cadre mais pas plus haute.
    const content = { width: 300, height: 150 };
    expect(clampOffset({ x: 400, y: 120 }, 2, content, SIZE)).toEqual({ x: 150, y: 0 });
  });
});

describe("toggleScale", () => {
  it("agrandit depuis la taille normale, revient sinon", () => {
    expect(toggleScale(1)).toBe(2.5);
    expect(toggleScale(1.8)).toBe(1);
    expect(toggleScale(4)).toBe(1);
  });
});

describe("distanceBetween", () => {
  it("mesure l'écart entre deux doigts", () => {
    expect(distanceBetween({ pageX: 0, pageY: 0 }, { pageX: 30, pageY: 40 })).toBe(50);
  });
});
