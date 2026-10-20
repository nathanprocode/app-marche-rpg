/**
 * Un nom de police par graisse : sur Android, `fontWeight` est ignoré avec les polices personnalisées.
 * Les noms correspondent aux clés chargées dans src/core/fonts.ts.
 *
 * - Shippori Mincho B1 : titres et grands chiffres, le lettrage du tome.
 * - Zen Kaku Gothic New : toute l'interface.
 * Les deux sont réduites aux caractères latins (assets/fonts).
 */
const families = {
  mincho: "ShipporiMinchoB1_800ExtraBold",
  gothic: "ZenKakuGothicNew_400Regular",
  gothicBold: "ZenKakuGothicNew_700Bold",
  gothicBlack: "ZenKakuGothicNew_900Black",
} as const;

export const fontFamily = families;

/** Les polices chargées au démarrage (src/core/fonts.ts). */
export const loadedFontFamilies = families;

/**
 * Pour les grands chiffres : ils suivent le réglage « Taille de police » d'Android, mais plafonnés et réduits
 * si besoin pour tenir sur une ligne, sans sortir de l'écran.
 * À étaler sur le <Text> : `<Text {...fitDisplayText} style={...}>`.
 */
export const fitDisplayText = { numberOfLines: 1, adjustsFontSizeToFit: true, maxFontSizeMultiplier: 1.3 } as const;

/** Échelle typographique : toutes les hauteurs de ligne sont des multiples de 4. */
export const text = {
  /** Le kilométrage de la Traque. */
  displayXl: { fontFamily: families.mincho, fontSize: 96, lineHeight: 100, letterSpacing: -2 },
  displayL: { fontFamily: families.mincho, fontSize: 40, lineHeight: 48 },
  displayM: { fontFamily: families.mincho, fontSize: 28, lineHeight: 36 },
  displayS: { fontFamily: families.mincho, fontSize: 22, lineHeight: 28 },
  /** Chiffres de l'interface (pas du jour, Marque, totaux). */
  figure: { fontFamily: families.gothicBlack, fontSize: 36, lineHeight: 40 },
  body: { fontFamily: families.gothic, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: families.gothicBold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: families.gothic, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: families.gothicBold, fontSize: 12, lineHeight: 16, letterSpacing: 1 },
} as const;
