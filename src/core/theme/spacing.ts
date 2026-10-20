/** Grille de 8 : la clé est la valeur en px (theme.space[16] = --space-16). */
export const space = {
  4: 4,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  48: 48,
  64: 64,
  96: 96,
  128: 128,
} as const;

/** Gouttière noire entre deux cases, et épaisseur des cadres. */
export const gutter = 6;
export const frame = 2;

/** Les cases ont des angles vifs. */
export const radius = {
  0: 0,
  /** @deprecated Ancien rayon, ramené à 0 le temps de la migration. */
  4: 0,
} as const;
