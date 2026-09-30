import { requireOptionalNativeModule } from "expo-modules-core";

type PermanentPedometerModule = {
  startTracking(title: string, text: string, baseTotalSteps: number, baseStepsToday: number, metersPerStep: number): boolean;
  stopTracking(): boolean;
  updateNotification(
    title: string,
    text: string,
    baseTotalSteps: number,
    baseStepsToday: number,
    metersPerStep: number,
  ): boolean;
  getSteps(): number;
  getDailySteps(): string;
  acknowledgeSteps(): void;
};

const PermanentPedometer = requireOptionalNativeModule<PermanentPedometerModule>("PermanentPedometer");

export function startTracking(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): boolean {
  return PermanentPedometer?.startTracking(title, text, baseTotalSteps, baseStepsToday, metersPerStep) ?? false;
}

export function stopTracking(): boolean {
  return PermanentPedometer?.stopTracking() ?? false;
}

export function updateNotification(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): boolean {
  return PermanentPedometer?.updateNotification(title, text, baseTotalSteps, baseStepsToday, metersPerStep) ?? false;
}

export function getSteps(): number {
  return PermanentPedometer?.getSteps() ?? 0;
}

export function getDailySteps(): string {
  return PermanentPedometer?.getDailySteps() ?? "{}";
}

export function acknowledgeSteps(): void {
  PermanentPedometer?.acknowledgeSteps();
}

export default PermanentPedometer;
