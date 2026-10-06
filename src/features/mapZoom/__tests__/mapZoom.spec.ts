import {
  MAP_MAX_ZOOM,
  anchorUnder,
  clampMapOffset,
  clampZoom,
  dotsAlongPath,
  fitZoom,
  gestureTransform,
  isInRect,
  pinchZoom,
  strokeAtZoom,
  touchDistance,
  touchFocal,
  viewForAnchor,
  visibleMapRect,
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

describe("dotsAlongPath", () => {
  it("pose un point tous les `spacing`, sans repartir de zéro à chaque coude", () => {
    const dots = dotsAlongPath([{ x: 0, y: 0 }, { x: 15, y: 0 }, { x: 15, y: 15 }], 10);
    expect(dots).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 15, y: 5 }, { x: 15, y: 15 }]);
  });

  it("ne renvoie rien pour un tracé vide ou un écart nul", () => {
    expect(dotsAlongPath([], 10)).toEqual([]);
    expect(dotsAlongPath([{ x: 0, y: 0 }, { x: 5, y: 0 }], 0)).toEqual([]);
  });

  it("supporte deux points confondus", () => {
    expect(dotsAlongPath([{ x: 3, y: 3 }, { x: 3, y: 3 }], 10)).toEqual([{ x: 3, y: 3 }]);
  });
});

describe("visibleMapRect", () => {
  it("donne la zone du dessin sous le cadre, élargie de la marge", () => {
    const view = { zoom: 2, offset: { x: -200, y: -100 } };
    expect(visibleMapRect(view, VIEWPORT)).toEqual({ x: 100, y: 50, width: 195, height: 390 });
    const wide = visibleMapRect(view, VIEWPORT, 1);
    expect(isInRect({ x: 100 - 190, y: 50 }, wide)).toBe(true);
    expect(isInRect({ x: 100 - 200, y: 50 }, wide)).toBe(false);
  });
});

describe("gestureTransform", () => {
  it("place le dessin comme un vrai rendu au nouveau zoom", () => {
    const view = { zoom: 1.5, offset: { x: -300, y: -120 } };
    const layoutZoom = 0.9;
    const { translateX, translateY, scale } = gestureTransform(view, layoutZoom, MAP);
    // Un point du dessin, posé à la taille du rendu puis mis à l'échelle autour du centre de la vue.
    const point = { x: 700, y: 400 };
    const center = { x: (MAP.width * layoutZoom) / 2, y: (MAP.height * layoutZoom) / 2 };
    const screenX = translateX + center.x + scale * (point.x * layoutZoom - center.x);
    const screenY = translateY + center.y + scale * (point.y * layoutZoom - center.y);
    expect(screenX).toBeCloseTo(view.offset.x + point.x * view.zoom, 6);
    expect(screenY).toBeCloseTo(view.offset.y + point.y * view.zoom, 6);
  });

  it("revient à un simple décalage quand le zoom n'a pas changé", () => {
    expect(gestureTransform({ zoom: 0.9, offset: { x: -10, y: -20 } }, 0.9, MAP)).toEqual({ translateX: -10, translateY: -20, scale: 1 });
  });
});
