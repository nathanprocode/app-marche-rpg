import { buildProgressFromSteps, computeGlobalProgressPct } from "../engine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function testProgressionEngine(): void {
  const pct = computeGlobalProgressPct(1000);
  assert(pct > 0, "global progress should be > 0 for 1000km");

  const progress = buildProgressFromSteps(10_000, 3, new Date().toISOString());
  assert(progress.totalSteps === 10_000, "totalSteps should match input");
}
