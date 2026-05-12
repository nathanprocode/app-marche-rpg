import { requireNativeModule } from "expo-modules-core";

type PermanentPedometerModule = {
  startTracking(title: string, text: string, baseTotalSteps: number, baseStepsToday: number, metersPerStep: number): void;
  stopTracking(): void;
  updateNotification(title: string, text: string, baseTotalSteps: number, baseStepsToday: number, metersPerStep: number): void;
  getSteps(): number;
  acknowledgeSteps(): void;
};

const PermanentPedometer = requireNativeModule<PermanentPedometerModule>("PermanentPedometer");

export function startTracking(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): void {
  PermanentPedometer.startTracking(title, text, baseTotalSteps, baseStepsToday, metersPerStep);
}

export function stopTracking(): void {
  PermanentPedometer.stopTracking();
}

export function updateNotification(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): void {
  PermanentPedometer.updateNotification(title, text, baseTotalSteps, baseStepsToday, metersPerStep);
}

export function getSteps(): number {
  return PermanentPedometer.getSteps();
}

export function acknowledgeSteps(): void {
  PermanentPedometer.acknowledgeSteps();
}

export default PermanentPedometer;
