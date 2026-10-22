/** Un rectangle à l'écran, en px. */
export type Box = { left: number; top: number; right: number; bottom: number };

export type LabelRequest = {
  id: string;
  /** Les places possibles, de la préférée à la moins bonne. */
  candidates: Box[];
  /** Sans place libre : true garde la première place malgré le chevauchement, false masque l'étiquette. */
  required: boolean;
};

/** Index de la place retenue pour chaque étiquette, ou null si elle est masquée. */
export type LabelPlacement = Record<string, number | null>;

export function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * Pose les étiquettes de la carte une à une, dans l'ordre donné (les plus importantes d'abord) : chacune prend sa
 * première place qui ne touche ni un obstacle (Guts) ni une étiquette déjà posée.
 */
export function placeLabels(requests: LabelRequest[], obstacles: Box[]): LabelPlacement {
  const taken: Box[] = [...obstacles];
  const placement: LabelPlacement = {};

  for (const request of requests) {
    const free = request.candidates.findIndex((box) => !taken.some((other) => overlaps(box, other)));
    const chosen = free >= 0 ? free : request.required && request.candidates.length > 0 ? 0 : null;
    placement[request.id] = chosen;
    if (chosen !== null) taken.push(request.candidates[chosen]);
  }

  return placement;
}
