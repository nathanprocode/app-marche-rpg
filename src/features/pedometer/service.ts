import { GAME_CONFIG } from "../../core/constants/game";
import { getPedometerPermissionStatus } from "./permissions";
import { simulateStepsIncrement } from "./simulator";
import type { PedometerSnapshot } from "./types";

export async function readStepsToday(currentSteps: number): Promise<PedometerSnapshot> {
  const permission = await getPedometerPermissionStatus();

  if (permission !== "granted") {
    return simulateStepsIncrement(currentSteps, 0);
  }

  // Native sensor integration will be implemented in the Expo runtime (next iteration).
  return simulateStepsIncrement(currentSteps, 250);
}

export function stepsToKm(steps: number): number {
  const meters = steps * GAME_CONFIG.metersPerStep;
  return meters / 1000;
}
