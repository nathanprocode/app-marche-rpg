/**
 * Un nom de police par graisse : sur Android, `fontWeight` est ignoré avec les polices personnalisées.
 * Les noms correspondent aux clés chargées dans src/core/fonts.ts.
 */
export const fontFamily = {
  display: "PirataOne_400Regular",
  body: "Spectral_400Regular",
  bodyItalic: "Spectral_400Regular_Italic",
  bodyStrong: "Spectral_600SemiBold",
  label: "SpectralSC_600SemiBold",
} as const;

/** Échelle typographique : toutes les hauteurs de ligne sont des multiples de 4. */
export const text = {
  displayXl: { fontFamily: fontFamily.display, fontSize: 96, lineHeight: 96 },
  displayL: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 48 },
  displayM: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 32 },
  displayS: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 32 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamily.bodyStrong, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.label, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 },
} as const;
