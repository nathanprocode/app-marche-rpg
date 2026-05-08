import { requireNativeModule } from "expo-modules-core";

type PermanentPedometerModule = {
  startTracking(title: string, text: string): void;
  stopTracking(): void;
  updateNotification(title: string, text: string): void;
  getSteps(): number;
};

const PermanentPedometer = requireNativeModule<PermanentPedometerModule>("PermanentPedometer");

export function startTracking(title: string, text: string): void {
  PermanentPedometer.startTracking(title, text);
}

export function stopTracking(): void {
  PermanentPedometer.stopTracking();
}

export function updateNotification(title: string, text: string): void {
  PermanentPedometer.updateNotification(title, text);
}

export function getSteps(): number {
  return PermanentPedometer.getSteps();
}

export default PermanentPedometer;
