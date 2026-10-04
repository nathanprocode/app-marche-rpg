import {
  MAP_MAX_ZOOM,
  anchorUnder,
  clampMapOffset,
  clampZoom,
  fitZoom,
  pinchZoom,
  strokeAtZoom,
  touchDistance,
  touchFocal,
  viewForAnchor,
} from "../mapZoom";

const MAP = { width: 1448, height: 1086 };
const VIEWPORT = { width: 390, height: 780 };

describe("fitZoom", () => {
  it("fait tenir toute la carte dans le cadre", () => {
    const zoom = fitZoom(MAP, VIEWPORT);
    expect(MAP.width * zoom).toBeLessThanOrEqual(VIEWPORT.width + 0.001);
    expect(MAP.height * zoom).toBeLessThanOrEqual(VIEWPORT.height + 0.001);
    expect(zoom).toBeCloseTo(390 / 1448, 5);
  });

  it("reste raisonnable tant que le cadre n'est pas mesuré", () => {
    expect(fitZoom(MAP, { width: 0, height: 0 })).toBeGreaterThan(0);
  });
});

describe("clampMapOffset", () => {
  it("garde la carte collée aux bords du cadre quand elle est plus grande", () => {
    const zoom = 1;
    expect(clampMapOffset({ x: 50, y: 50 }, zoom, MAP, VIEWPORT)).toEqual({ x: 0, y: 0 });
    expect(clampMapOffset({ x: -5000, y: -5000 }, zoom, MAP, VIEWPORT)).toEqual({
      x: VIEWPORT.width - MAP.width,
      y: VIEWPORT.height - MAP.height,
    });
  });

  it("centre la carte quand elle est plus petite que le cadre", () => {
    const zoom = 0.2;
    const offset = clampMapOffset({ x: 999, y: -999 }, zoom, MAP, VIEWPORT);
    expect(offset.x).toBeCloseTo((VIEWPORT.width - MAP.width * zoom) / 2, 5);
    expect(offset.y).toBeCloseTo((VIEWPORT.height - MAP.height * zoom) / 2, 5);
  });
});

describe("viewForAnchor", () => {
  it("garde le point pincé sous les doigts quand le zoom change", () => {
    const start = { zoom: 1, offset: { x: -400, y: -300 } };
    const focal = { x: 200, y: 400 };
    const anchor = anchorUnder(start, focal);
    expect(anchor).toEqual({ x: 600, y: 700 });

    const next = viewForAnchor(anchor, focal, 2, MAP, VIEWPORT);
    // Le point (600, 700) du dessin est toujours sous (200, 400).
    expect(next.offset.x + anchor.x * next.zoom).toBeCloseTo(focal.x, 5);
    expect(next.offset.y + anchor.y * next.zoom).toBeCloseTo(focal.y, 5);
  });

  it("fait glisser la carte avec le doigt quand le zoom ne change pas", () => {
    const start = { zoom: 1, offset: { x: -400, y: -200 } };
    const anchor = anchorUnder(start, { x: 200, y: 400 });
    const next = viewForAnchor(anchor, { x: 230, y: 380 }, 1, MAP, VIEWPORT);
    expect(next.offset).toEqual({ x: -370, y: -220 });
  });

  it("ne laisse jamais apparaître de vide autour de la carte", () => {
    const next = viewForAnchor({ x: 10, y: 10 }, { x: 300, y: 600 }, 2, MAP, VIEWPORT);
    expect(next.offset.x).toBeLessThanOrEqual(0);
    expect(next.offset.y).toBeLessThanOrEqual(0);
  });
});

describe("pinchZoom", () => {
  it("suit l'écart des doigts", () => {
    expect(pinchZoom(1, 100, 200, 0.2)).toBe(2);
    expect(pinchZoom(1, 100, 50, 0.2)).toBe(0.5);
  });

  it("reste entre le zoom minimum et le maximum", () => {
    expect(pinchZoom(1, 100, 10, 0.3)).toBe(0.3);
    expect(pinchZoom(2, 100, 1000, 0.3)).toBe(MAP_MAX_ZOOM);
  });

  it("garde le zoom sans écart de départ", () => {
    expect(pinchZoom(1.5, 0, 120, 0.3)).toBe(1.5);
    expect(clampZoom(9, 0.3)).toBe(MAP_MAX_ZOOM);
  });
});

describe("doigts", () => {
  it("mesurent l'écart et le milieu", () => {
    const a = { pageX: 0, pageY: 0 };
    const b = { pageX: 30, pageY: 40 };
    expect(touchDistance(a, b)).toBe(50);
    expect(touchFocal([a, b])).toEqual({ pageX: 15, pageY: 20 });
    expect(touchFocal([a])).toBe(a);
    expect(touchFocal([])).toBeNull();
  });
});

describe("strokeAtZoom", () => {
  it("garde un trait de même taille à l'écran quel que soit le zoom", () => {
    expect(strokeAtZoom(4, 1) * 1).toBe(4);
    expect(strokeAtZoom(4, 0.5) * 0.5).toBeCloseTo(4, 5);
    expect(strokeAtZoom(4, 2) * 2).toBeCloseTo(4, 5);
  });
});
