export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
/** Zoom appliqué par un double toucher (ou le bouton +), depuis la taille normale. */
export const DOUBLE_TAP_SCALE = 2.5;

export type Size = { width: number; height: number };
export type Offset = { x: number; y: number };

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function distanceBetween(a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/** Pincement : l'échelle suit l'écart entre les deux doigts depuis le début du geste. */
export function pinchScale(startScale: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return clampScale(startScale);
  return clampScale((startScale * distance) / startDistance);
}

/** Taille affichée d'une image en mode « contain » : entière, centrée, avec des bandes si besoin. */
export function containSize(image: Size, viewport: Size): Size {
  if (!image.width || !image.height) return viewport;
  const fit = Math.min(viewport.width / image.width, viewport.height / image.height);
  return { width: image.width * fit, height: image.height * fit };
}

/**
 * Décalage autorisé pour une image agrandie depuis son centre : on peut la déplacer jusqu'à ce que ses bords
 * touchent ceux du cadre, jamais au-delà (pas de vide qui apparaît). Tant qu'elle tient dans le cadre, elle reste centrée.
 *
 * @param content  taille de l'image affichée à l'échelle 1 (voir containSize).
 * @param viewport taille du cadre.
 */
export function clampOffset(offset: Offset, scale: number, content: Size, viewport: Size): Offset {
  const maxX = Math.max(0, (content.width * scale - viewport.width) / 2);
  const maxY = Math.max(0, (content.height * scale - viewport.height) / 2);
  // « + 0 » transforme un éventuel -0 en 0.
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)) + 0,
    y: Math.min(maxY, Math.max(-maxY, offset.y)) + 0,
  };
}

/** Double toucher : agrandit si l'image est à sa taille normale, sinon revient à la taille normale. */
export function toggleScale(scale: number): number {
  return scale > MIN_SCALE + 0.01 ? MIN_SCALE : DOUBLE_TAP_SCALE;
}
