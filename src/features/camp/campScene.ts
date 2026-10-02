export type CampTime = "day" | "night";

export type CampScene = {
  /** Jour : Guts en marche sur le sentier. Nuit : Guts au repos près du feu. */
  time: CampTime;
  /** Phrase d'ambiance sous la vignette. */
  line: string;
};

/** La nuit va de 20 h à 6 h (heure locale du téléphone). */
export function resolveCampTime(hour: number): CampTime {
  return hour >= 20 || hour < 6 ? "night" : "day";
}

/**
 * Les titres de checkpoints sont des noms d'épisodes (« Le Comte », « L'Éclipse ») :
 * on les cite entre guillemets après « Depuis », jamais après « de » (« de Le Comte »).
 */
function since(lastStop: string): string {
  return `Depuis « ${lastStop} »`;
}

/**
 * @param hour     heure locale (0-23).
 * @param isCalm   la Marque est apaisée (seuil de pas du jour atteint).
 * @param lastStop titre du dernier checkpoint franchi.
 */
export function resolveCampScene(hour: number, isCalm: boolean, lastStop: string): CampScene {
  const time = resolveCampTime(hour);
  const from = since(lastStop);

  if (time === "night") {
    return {
      time,
      line: isCalm
        ? `Le feu crépite et la Marque se tait. ${from}, tu as gagné ton repos.`
        : `La nuit tombe et la Marque brûle encore. ${from}, il reste quelques pas avant de dormir.`,
    };
  }

  if (hour < 12) {
    return {
      time,
      line: isCalm
        ? `Le jour se lève à peine et la Marque est déjà apaisée. ${from}, la route t'appartient.`
        : `Le camp s'éveille. ${from}, le sentier attend tes premiers pas.`,
    };
  }

  return {
    time,
    line: isCalm
      ? `La Marque se tait. ${from}, chaque pas de plus est une victoire.`
      : `La Marque saigne sous le soleil. ${from}, le sentier n'attend que toi.`,
  };
}
