import { Platform } from "react-native";

type PermanentPedometerModule = {
  startTracking(title: string, text: string, baseTotalSteps: number, baseStepsToday: number, metersPerStep: number): void;
  stopTracking(): void;
  updateNotification(title: string, text: string, baseTotalSteps: number, baseStepsToday: number, metersPerStep: number): void;
  getSteps(): number;
  /** Absente des builds natifs antérieurs. */
  getStepsBeforeToday?(): number;
  acknowledgeSteps(consumedSteps: number): void;
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

    permanentPedometer.startTracking(title, text, baseTotalSteps, baseStepsToday, metersPerStep);
    return true;
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

    permanentPedometer.updateNotification(title, text, baseTotalSteps, baseStepsToday, metersPerStep);
    return true;
  } catch (error) {
    console.log("[PermanentPedometer] updateNotification failed", error);
    return false;
  }
}

export async function safeAcknowledgeSteps(consumedSteps: number): Promise<void> {
  try {
    const permanentPedometer = await loadPermanentPedometerModule();
    if (!permanentPedometer?.acknowledgeSteps) {
      return;
    }

    permanentPedometer.acknowledgeSteps(consumedSteps);
  } catch (error) {
    console.log("[PermanentPedometer] acknowledgeSteps failed", error);
  }
}

/** Pas en attente datant d'avant minuit ; 0 si le build natif est trop ancien pour le savoir. */
export function safeGetStepsBeforeToday(permanentPedometer: PermanentPedometerModule | null): number {
  try {
    return permanentPedometer?.getStepsBeforeToday?.() ?? 0;
  } catch (error) {
    console.log("[PermanentPedometer] getStepsBeforeToday failed", error);
    return 0;
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
