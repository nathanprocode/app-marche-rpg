import type { PedometerSnapshot } from "./types";

export function simulateStepsIncrement(currentSteps: number, increment = 120): PedometerSnapshot {
  return {
    stepsToday: Math.max(0, currentSteps + increment),
    updatedAtISO: new Date().toISOString(),
    source: "simulator",
  };
}
