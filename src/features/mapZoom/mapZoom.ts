export type Size = { width: number; height: number };
export type Offset = { x: number; y: number };

/** Vue de la carte : zoom (1 = taille d'origine du dessin) et position du coin haut-gauche dans le cadre. */
export type MapView = { zoom: number; offset: Offset };

/** Au-delà, le dessin (1448 px de large) devient trop flou pour être utile. */
export const MAP_MAX_ZOOM = 2.2;
/** Zoom d'arrivée sur la carte, et celui du bouton « recentrer ». */
export const MAP_BASE_ZOOM = 0.9;

/** Zoom le plus petit : la carte entière tient dans le cadre. */
export function fitZoom(map: Size, viewport: Size): number {
  if (!viewport.width || !viewport.height) return MAP_BASE_ZOOM;
  return Math.min(viewport.width / map.width, viewport.height / map.height);
}

export function clampZoom(zoom: number, min: number, max = MAP_MAX_ZOOM): number {
  return Math.min(max, Math.max(min, zoom));
}

/**
 * Décalage autorisé : la carte ne laisse jamais de vide dans le cadre une fois plus grande que lui,
 * et reste centrée tant qu'elle est plus petite.
 */
export function clampMapOffset(offset: Offset, zoom: number, map: Size, viewport: Size): Offset {
  const scaledWidth = map.width * zoom;
  const scaledHeight = map.height * zoom;

  return {
    x:
      scaledWidth <= viewport.width
        ? (viewport.width - scaledWidth) / 2
        : Math.max(viewport.width - scaledWidth, Math.min(0, offset.x)),
    y:
      scaledHeight <= viewport.height
        ? (viewport.height - scaledHeight) / 2
        : Math.max(viewport.height - scaledHeight, Math.min(0, offset.y)),
  };
}

/** Point du dessin (à l'échelle 1) qui se trouve sous un point du cadre. */
export function anchorUnder(view: MapView, focal: Offset): Offset {
  return { x: (focal.x - view.offset.x) / view.zoom, y: (focal.y - view.offset.y) / view.zoom };
}

/**
 * Vue où le point du dessin `anchor` est sous `focal` au zoom demandé : un seul calcul pour le glissement
 * (zoom inchangé, le doigt bouge) et le pincement (le zoom change autour du milieu des deux doigts).
 */
export function viewForAnchor(anchor: Offset, focal: Offset, zoom: number, map: Size, viewport: Size): MapView {
  return {
    zoom,
    offset: clampMapOffset({ x: focal.x - anchor.x * zoom, y: focal.y - anchor.y * zoom }, zoom, map, viewport),
  };
}

/** Pincement : le zoom suit l'écart entre les deux doigts depuis le début du geste. */
export function pinchZoom(startZoom: number, startDistance: number, distance: number, min: number, max = MAP_MAX_ZOOM): number {
  if (startDistance <= 0) return clampZoom(startZoom, min, max);
  return clampZoom((startZoom * distance) / startDistance, min, max);
}

export type Touch = { pageX: number; pageY: number };

export function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/** Centre du geste : le doigt, ou le milieu des deux premiers doigts. */
export function touchFocal(touches: Touch[]): Touch | null {
  if (touches.length === 0) return null;
  if (touches.length === 1) return touches[0];
  return { pageX: (touches[0].pageX + touches[1].pageX) / 2, pageY: (touches[0].pageY + touches[1].pageY) / 2 };
}

/**
 * Taille d'un trait à l'écran constante quelle que soit l'échelle : le tracé est dessiné dans le repère du dessin
 * (qui se réduit avec le zoom), on le grossit donc en sens inverse.
 */
export function strokeAtZoom(screenPx: number, zoom: number): number {
  return screenPx / Math.max(zoom, 0.05);
}
