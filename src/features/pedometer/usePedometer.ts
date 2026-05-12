import { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { PermissionsAndroid, Platform } from "react-native";
import { GAME_CONFIG } from "../../core/constants/game";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { clearPersistentTrackingNotificationAsync, updatePersistentTrackingNotificationAsync } from "./persistentTracking";
import {
  loadPermanentPedometerModule,
  safeAcknowledgeSteps,
  safeGetSteps,
  safeStartTracking,
  safeStopTracking,
  safeUpdateNotification,
} from "./permanentPedometerNative";
import { stepsToKm } from "./service";
import { buildTrackingNotificationContent } from "./trackingNotification";

type PedometerPermission = "granted" | "denied" | "undetermined";

type UsePedometerState = {
  isAvailable: boolean | null;
  permission: PedometerPermission;
  isWatching: boolean;
  error: string | null;
};

const ENABLE_NATIVE_FOREGROUND_SERVICE = false;

function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function shouldRefreshNotification(previousBucket: number | null, totalSteps: number): boolean {
  const currentBucket = Math.floor(stepsToKm(totalSteps) * 100);
  return previousBucket !== currentBucket;
}

async function requestAndroidPermanentTrackingPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  const hasActivityPermission = await requestAndroidActivityRecognitionPermission();
  if (!hasActivityPermission) {
    return false;
  }

  return requestAndroidNotificationPermission();
}

async function requestAndroidActivityRecognitionPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  const activityPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
    {
      title: "Autoriser le suivi des pas",
      message: "Autorisez l'accès pour que vos pas fassent avancer le Traqué sur la carte.",
      buttonPositive: "Autoriser",
      buttonNegative: "Refuser",
    },
  );

  return activityPermission === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== "android" || Platform.Version < 33) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if (alreadyGranted) {
    return true;
  }

  const notificationPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: "Autoriser la notification permanente",
      message: "La Marche du Faucon a besoin d'une notification visible pour continuer le suivi en arrière-plan.",
      buttonPositive: "Autoriser",
      buttonNegative: "Refuser",
    },
  );

  return notificationPermission === PermissionsAndroid.RESULTS.GRANTED;
}

export function usePedometer(enabled = true): UsePedometerState {
  const [state, setState] = useState<UsePedometerState>({
    isAvailable: null,
    permission: "undetermined",
    isWatching: false,
    error: null,
  });
  const lastNativeStepsRef = useRef<number | null>(null);
  const lastNotifiedDistanceBucketRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let subscription: { remove: () => void } | null = null;

    async function syncNativeSteps(nativeSteps: number): Promise<void> {
      const deltaSteps = Math.max(0, Math.round(nativeSteps));
      if (deltaSteps <= 0) {
        return;
      }

      const progress = usePlayerStore.getState().progress;
      const currentStepsToday = usePedometerStore.getState().stepsToday;
      const nextTotalSteps = progress.totalSteps + deltaSteps;
      const nextStepsToday = currentStepsToday + deltaSteps;

      usePedometerStore.getState().setLiveSteps(nextStepsToday);
      await usePlayerStore
        .getState()
        .syncFromSteps(nextTotalSteps, progress.streakDays, progress.lastActiveDateISO);
      await safeAcknowledgeSteps();

      const { title, text } = buildTrackingNotificationContent(nextStepsToday, nextTotalSteps);
      const didUpdateNativeNotification = await safeUpdateNotification(
        title,
        text,
        nextTotalSteps,
        nextStepsToday,
        GAME_CONFIG.metersPerStep,
      );

      if (shouldRefreshNotification(lastNotifiedDistanceBucketRef.current, nextTotalSteps)) {
        lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(nextTotalSteps) * 100);

        if (!didUpdateNativeNotification) {
          await updatePersistentTrackingNotificationAsync({
            stepsToday: nextStepsToday,
            totalSteps: nextTotalSteps,
          });
        }
      }
    }

    async function startNativePedometer(): Promise<boolean> {
      const permanentPedometer = await loadPermanentPedometerModule();
      if (!permanentPedometer) {
        return false;
      }

      const hasPermissions = await requestAndroidPermanentTrackingPermissions();
      if (!hasPermissions) {
        if (isMounted) {
          setState({ isAvailable: true, permission: "denied", isWatching: false, error: null });
        }
        return true;
      }

      const progress = usePlayerStore.getState().progress;
      const stepsToday = usePedometerStore.getState().stepsToday;
      const { title, text } = buildTrackingNotificationContent(stepsToday, progress.totalSteps);

      const didStart = await safeStartTracking(
        title,
        text,
        progress.totalSteps,
        stepsToday,
        GAME_CONFIG.metersPerStep,
      );
      if (!didStart) {
        return false;
      }

      const initialNativeSteps = safeGetSteps(permanentPedometer);
      if (initialNativeSteps === null) {
        void safeStopTracking();
        return false;
      }

      lastNativeStepsRef.current = 0;
      lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(progress.totalSteps) * 100);

      await syncNativeSteps(initialNativeSteps);

      intervalId = setInterval(() => {
        const nativeSteps = safeGetSteps(permanentPedometer);
        if (nativeSteps !== null) {
          void syncNativeSteps(nativeSteps);
        }
      }, 5000);

      if (isMounted) {
        setState({ isAvailable: true, permission: "granted", isWatching: true, error: null });
      }

      return true;
    }

    async function startExpoPedometerFallback(): Promise<void> {
      const hasActivityPermission = await requestAndroidActivityRecognitionPermission();
      if (!hasActivityPermission) {
        if (isMounted) {
          setState({ isAvailable: true, permission: "denied", isWatching: false, error: null });
        }
        return;
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isMounted) return;

      setState((current) => ({ ...current, isAvailable, error: null }));

      if (!isAvailable) {
        return;
      }

      let permissionResponse = await Pedometer.getPermissionsAsync();
      if (!permissionResponse.granted) {
        permissionResponse = await Pedometer.requestPermissionsAsync();
      }

      const permission: PedometerPermission = permissionResponse.granted ? "granted" : "denied";
      if (!isMounted) return;

      setState((current) => ({ ...current, permission }));

      if (!permissionResponse.granted) {
        return;
      }

      const baseTotalSteps = usePlayerStore.getState().progress.totalSteps;
      let baseStepsToday = usePedometerStore.getState().stepsToday;
      let lastSensorStepsToday = baseStepsToday;

      async function refreshTrackingNotification(stepsToday: number, totalSteps: number): Promise<void> {
        try {
          await updatePersistentTrackingNotificationAsync({ stepsToday, totalSteps });
        } catch (error) {
          console.log("[Pedometer] tracking notification update failed", error);
        }
      }

      async function applySensorSteps(nextSensorStepsToday: number): Promise<void> {
        const deltaSteps = Math.max(0, Math.round(nextSensorStepsToday - lastSensorStepsToday));
        if (deltaSteps <= 0) {
          return;
        }

        lastSensorStepsToday = nextSensorStepsToday;
        const progress = usePlayerStore.getState().progress;
        const currentStepsToday = usePedometerStore.getState().stepsToday;
        const liveStepsToday = currentStepsToday + deltaSteps;
        const liveTotalSteps = progress.totalSteps + deltaSteps;

        usePedometerStore.getState().setLiveSteps(liveStepsToday);
        await usePlayerStore.getState().syncFromSteps(liveTotalSteps, progress.streakDays, progress.lastActiveDateISO);

        if (shouldRefreshNotification(lastNotifiedDistanceBucketRef.current, liveTotalSteps)) {
          lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(liveTotalSteps) * 100);
          await refreshTrackingNotification(liveStepsToday, liveTotalSteps);
        }
      }

      try {
        const todaySnapshot = await Pedometer.getStepCountAsync(getStartOfToday(), new Date());
        baseStepsToday = todaySnapshot.steps;
        lastSensorStepsToday = todaySnapshot.steps;
        usePedometerStore.getState().setLiveSteps(baseStepsToday);
      } catch (error) {
        console.log("[Pedometer] daily snapshot unavailable", error);
      }

      await refreshTrackingNotification(baseStepsToday, baseTotalSteps);

      subscription = Pedometer.watchStepCount(({ steps }: { steps: number }) => {
        void applySensorSteps(baseStepsToday + steps);
      });

      intervalId = setInterval(() => {
        Pedometer.getStepCountAsync(getStartOfToday(), new Date())
          .then((snapshot) => applySensorSteps(snapshot.steps))
          .catch((error) => {
            console.log("[Pedometer] polling snapshot unavailable", error);
          });
      }, 10000);

      if (isMounted) {
        setState((current) => ({ ...current, isWatching: true }));
      }
    }

    async function startPedometer(): Promise<void> {
      if (!enabled) {
        await clearPersistentTrackingNotificationAsync();
        return;
      }

      try {
        if (ENABLE_NATIVE_FOREGROUND_SERVICE) {
          const didStartNative = await startNativePedometer();
          if (didStartNative) {
            return;
          }
        }

        await startExpoPedometerFallback();
      } catch (error) {
        if (!isMounted) return;

        setState((current) => ({
          ...current,
          isWatching: false,
          error: error instanceof Error ? error.message : "Impossible de démarrer le podomètre.",
        }));
      }
    }

    void startPedometer();

    return () => {
      isMounted = false;
      subscription?.remove();
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (lastNativeStepsRef.current !== null) {
        void safeStopTracking();
      }
      void clearPersistentTrackingNotificationAsync();
    };
  }, [enabled]);

  return state;
}
