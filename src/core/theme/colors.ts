/**
 * Palette « Encre & Sang ».
 * Les noms reprennent les slugs des maquettes (--color-ink, --color-bone…) et les variables Figma.
 */
export const colors = {
  /** Fond de l'app. */
  ink: "#0C0A09",
  /** Cartes sombres. */
  inkRaised: "#171311",
  /** Filets et pistes de progression. */
  ash: "#2E2823",
  /** Bordures actives. */
  iron: "#5E6472",
  /** Papier : cartes claires et texte principal. */
  bone: "#E9E1CF",
  /** Texte secondaire sur fond sombre. */
  boneDim: "#B8AE98",
  /** Texte secondaire sur papier. */
  umber: "#5A5244",
  /** Actions et progression. */
  blood: "#8A0303",
  /** Accent vif et alertes (graphismes, gros texte). */
  bloodGlow: "#C1121F",
  /** Texte rouge sur fond sombre (contraste 4,5:1 minimum). */
  bloodEmber: "#E5484D",
} as const;

export type AppColors = typeof colors;
