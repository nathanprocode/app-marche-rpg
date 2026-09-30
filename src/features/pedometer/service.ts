import { GAME_CONFIG } from "../../core/constants/game";

/** Conversion unique pas -> km, utilisée partout dans l'app. */
export function stepsToKm(steps: number): number {
  const meters = steps * GAME_CONFIG.metersPerStep;
  return meters / 1000;
}
