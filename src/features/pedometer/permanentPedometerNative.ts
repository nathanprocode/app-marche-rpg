import { Platform } from "react-native";

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

let nativeModulePromise: Promise<PermanentPedometerModule | null> | null = null;

export function loadPermanentPedometerModule(): Promise<PermanentPedometerModule | null> {
  if (Platform.OS !== "android") {
    return Promise.resolve(null);
  }

  if (!nativeModulePromise) {
    nativeModulePromise = import("../../../modules/permanent-pedometer/src")
      .then((module) => module.default as PermanentPedometerModule)
      .catch((error) => {
        console.log("[PermanentPedometer] native module unavailable", error);
        return null;
      });
  }

  return nativeModulePromise;
}

export async function safeStartTracking(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): Promise<boolean> {
  try {
    const permanentPedometer = await loadPermanentPedometerModule();
    if (!permanentPedometer?.startTracking) {
      return false;
    }

    return permanentPedometer.startTracking(title, text, baseTotalSteps, baseStepsToday, metersPerStep) !== false;
  } catch (error) {
    console.log("[PermanentPedometer] startTracking failed", error);
    return false;
  }
}

export async function safeStopTracking(): Promise<void> {
  try {
    const permanentPedometer = await loadPermanentPedometerModule();
    if (!permanentPedometer?.stopTracking) {
      return;
    }

    permanentPedometer.stopTracking();
  } catch (error) {
    console.log("[PermanentPedometer] stopTracking failed", error);
  }
}

export async function safeUpdateNotification(
  title: string,
  text: string,
  baseTotalSteps: number,
  baseStepsToday: number,
  metersPerStep: number,
): Promise<boolean> {
  try {
    const permanentPedometer = await loadPermanentPedometerModule();
    if (!permanentPedometer?.updateNotification) {
      return false;
    }

    return permanentPedometer.updateNotification(title, text, baseTotalSteps, baseStepsToday, metersPerStep) !== false;
  } catch (error) {
    console.log("[PermanentPedometer] updateNotification failed", error);
    return false;
  }
}

export async function safeAcknowledgeSteps(): Promise<void> {
  try {
    const permanentPedometer = await loadPermanentPedometerModule();
    if (!permanentPedometer?.acknowledgeSteps) {
      return;
    }

    permanentPedometer.acknowledgeSteps();
  } catch (error) {
    console.log("[PermanentPedometer] acknowledgeSteps failed", error);
  }
}

export function safeGetSteps(permanentPedometer: PermanentPedometerModule | null): number | null {
  try {
    if (!permanentPedometer?.getSteps) {
      return null;
    }

    return permanentPedometer.getSteps();
  } catch (error) {
    console.log("[PermanentPedometer] getSteps failed", error);
    return null;
  }
}

export function safeGetDailySteps(permanentPedometer: PermanentPedometerModule | null): Record<string, number> | null {
  try {
    if (!permanentPedometer?.getDailySteps) {
      return null;
    }

    const rawDailySteps = permanentPedometer.getDailySteps();
    const parsedDailySteps = JSON.parse(rawDailySteps) as Record<string, unknown>;
    const normalizedDailySteps: Record<string, number> = {};

    Object.entries(parsedDailySteps).forEach(([dayKey, steps]) => {
      const normalizedSteps = Math.max(0, Math.round(Number(steps) || 0));
      if (normalizedSteps > 0) {
        normalizedDailySteps[dayKey] = normalizedSteps;
      }
    });

    return normalizedDailySteps;
  } catch (error) {
    console.log("[PermanentPedometer] getDailySteps failed", error);
    return null;
  }
}
