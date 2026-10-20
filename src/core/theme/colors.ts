/**
 * Palette « Trame & Encre » : l'app se lit comme un tome de Berserk.
 * Papier blanc froid, encre noire, deux valeurs de trame, et un seul rouge.
 */
const palette = {
  /** Papier : fond des cases. */
  paper: "#F3F3F0",
  /** Encre : texte, cadres, gouttières entre les cases, remplissages. */
  black: "#111111",
  /** Texte secondaire sur papier (contraste 8:1). */
  blackSoft: "#4A4A47",
  /** Trame dense : points de progression, cases verrouillées. Jamais pour du texte. */
  tone: "#8C8C88",
  /** Trame claire : filets secondaires, pistes vides. */
  toneLight: "#C8C8C3",
  /** Le seul rouge : la Marque, les alertes, le repère « tu es ici » (contraste 6:1 sur papier). */
  red: "#B3121B",

  // Cases inversées (fond noir), comme les scènes sombres de Miura.
  /** Texte secondaire sur noir (contraste 9:1). */
  paperSoft: "#B9B9B4",
  /** Trame sur noir : points à peine visibles. */
  toneDark: "#3A3A37",
  /** Le rouge lisible sur noir (contraste 4,7:1). */
  redOnBlack: "#E8414A",
} as const;

/**
 * Anciens noms (« Encre & Sang »), rebranchés sur la nouvelle palette le temps de migrer les écrans.
 * @deprecated À remplacer par les noms de `palette` ; supprimés à la fin de la refonte.
 */
const legacy = {
  ink: palette.paper,
  inkRaised: palette.paper,
  ash: palette.toneLight,
  iron: palette.tone,
  bone: palette.black,
  boneDim: palette.blackSoft,
  umber: palette.toneLight,
  blood: palette.red,
  bloodGlow: palette.red,
  bloodEmber: palette.red,
} as const;

export const colors = { ...palette, ...legacy } as const;

export type AppColors = typeof colors;
