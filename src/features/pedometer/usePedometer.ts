import { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { PermissionsAndroid, Platform } from "react-native";
import { GAME_CONFIG } from "../../core/constants/game";
import { shiftDay, toDayKey } from "../history/weekHistory";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useTrackingStore } from "../../store/useTrackingStore";
import { clearPersistentTrackingNotificationAsync, updatePersistentTrackingNotificationAsync } from "./persistentTracking";
import {
  loadPermanentPedometerModule,
  safeAcknowledgeSteps,
  safeGetSteps,
  safeGetStepsBeforeToday,
  safeStartTracking,
  safeStopTracking,
  safeUpdateNotification,
} from "./permanentPedometerNative";
import { stepsToKm } from "./service";
import { buildTrackingNotificationContent } from "./trackingNotification";
import type { TrackingStatus } from "./trackingStatus";

type PedometerPermission = "granted" | "denied" | "undetermined";

/** Réponse d'Android à une demande d'autorisation : « blocked » quand il ne la redemandera plus (« Ne plus demander »). */
type PermissionAnswer = "granted" | "denied" | "blocked";

function toPermissionAnswer(result: string): PermissionAnswer {
  if (result === PermissionsAndroid.RESULTS.GRANTED) return "granted";
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? "blocked" : "denied";
}

type UsePedometerState = {
  isAvailable: boolean | null;
  permission: PedometerPermission;
  isWatching: boolean;
  error: string | null;
};

const ENABLE_NATIVE_FOREGROUND_SERVICE = true;

function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

/** La notification montre le tour de Traque en cours, pas le total depuis le premier jour. */
function lapStepsOf(totalSteps: number): number {
  return Math.max(0, totalSteps - usePlayerStore.getState().progress.lapStartSteps);
}

function shouldRefreshNotification(previousBucket: number | null, totalSteps: number): boolean {
  const currentBucket = Math.floor(stepsToKm(totalSteps) * 100);
  return previousBucket !== currentBucket;
}

async function requestAndroidActivityRecognitionPermission(): Promise<PermissionAnswer> {
  if (Platform.OS !== "android") {
    return "granted";
  }

  // Déjà accordée : pas de fenêtre à chaque ouverture ou nouvel essai.
  if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION)) {
    return "granted";
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

  return toPermissionAnswer(activityPermission);
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

/**
 * @param enabled   compte les pas (app ouverte).
 * @param permanent suivi permanent : service Android avec notification, qui continue app fermée.
 */
export function usePedometer(enabled = true, permanent = false): UsePedometerState {
  const [state, setState] = useState<UsePedometerState>({
    isAvailable: null,
    permission: "undetermined",
    isWatching: false,
    error: null,
  });
  const lastNativeStepsRef = useRef<number | null>(null);
  const permanentRef = useRef(permanent);
  permanentRef.current = permanent;
  const lastNotifiedDistanceBucketRef = useRef<number | null>(null);
  // « Réessayer » et le retour des réglages du téléphone relancent le démarrage.
  const attempt = useTrackingStore((tracking) => tracking.attempt);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let subscription: { remove: () => void } | null = null;
    // Le suivi permanent a été demandé mais n'a pas pu démarrer : on compte quand même, appli ouverte.
    let isBackgroundOff = false;

    function report(status: TrackingStatus): void {
      if (isMounted) useTrackingStore.getState().setStatus(status);
    }

    /**
     * @param nativeSteps      pas en attente dans le service.
     * @param stepsBeforeToday parmi eux, ceux d'avant minuit (app fermée pendant la nuit) :
     *                         ils comptent dans le total, pas dans les pas du jour.
     */
    async function syncNativeSteps(nativeSteps: number, stepsBeforeToday: number): Promise<void> {
      const deltaSteps = Math.max(0, Math.round(nativeSteps));
      if (deltaSteps <= 0) {
        return;
      }

      const deltaToday = deltaSteps - Math.min(deltaSteps, Math.max(0, Math.round(stepsBeforeToday)));
      const progress = usePlayerStore.getState().progress;
      const nextTotalSteps = progress.totalSteps + deltaSteps;
      const nextStepsToday = usePedometerStore.getState().addLiveSteps(deltaToday);
      // Les pas d'avant minuit vont à la veille dans l'historique (au plus près : on ne sait pas de quel jour exact).
      usePedometerStore.getState().addStepsToDay(toDayKey(shiftDay(new Date(), -1)), deltaSteps - deltaToday);

      // syncFromSteps met l'état à jour tout de suite, puis attend la sauvegarde. On confirme les pas au
      // service sans attendre : tant qu'ils ne sont pas confirmés, le passage suivant (5 s plus tard)
      // les relirait et les compterait deux fois.
      const cloudSave = usePlayerStore
        .getState()
        .syncFromSteps(nextTotalSteps, progress.streakDays, progress.lastActiveDateISO);
      await safeAcknowledgeSteps(nativeSteps);
      cloudSave.catch((error) => {
        console.log("[Pedometer] cloud save failed", error);
      });

      const nextLapSteps = lapStepsOf(nextTotalSteps);
      const { title, text } = buildTrackingNotificationContent(nextStepsToday, nextLapSteps);
      const didUpdateNativeNotification = await safeUpdateNotification(
        title,
        text,
        nextLapSteps,
        nextStepsToday,
        GAME_CONFIG.metersPerStep,
      );

      if (shouldRefreshNotification(lastNotifiedDistanceBucketRef.current, nextLapSteps)) {
        lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(nextLapSteps) * 100);

        if (!didUpdateNativeNotification) {
          await updatePersistentTrackingNotificationAsync({
            stepsToday: nextStepsToday,
            totalSteps: nextLapSteps,
          });
        }
      }
    }

    async function startNativePedometer(): Promise<boolean> {
      const permanentPedometer = await loadPermanentPedometerModule();
      if (!permanentPedometer) {
        return false;
      }

      const activityPermission = await requestAndroidActivityRecognitionPermission();
      if (activityPermission !== "granted") {
        if (isMounted) {
          setState({ isAvailable: true, permission: "denied", isWatching: false, error: null });
        }
        report({ kind: "permissionDenied", canAsk: activityPermission === "denied" });
        return true;
      }

      // Notifications refusées : pas de service permanent, mais les pas restent comptés appli ouverte.
      if (!(await requestAndroidNotificationPermission())) {
        isBackgroundOff = true;
        return false;
      }

      const progress = usePlayerStore.getState().progress;
      const stepsToday = usePedometerStore.getState().stepsToday;
      const { title, text } = buildTrackingNotificationContent(stepsToday, progress.lapSteps);

      const didStart = await safeStartTracking(
        title,
        text,
        progress.lapSteps,
        stepsToday,
        GAME_CONFIG.metersPerStep,
      );
      if (!didStart) {
        isBackgroundOff = true;
        return false;
      }

      const initialNativeSteps = safeGetSteps(permanentPedometer);
      if (initialNativeSteps === null) {
        void safeStopTracking();
        isBackgroundOff = true;
        return false;
      }

      lastNativeStepsRef.current = 0;
      lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(progress.lapSteps) * 100);

      await syncNativeSteps(initialNativeSteps, safeGetStepsBeforeToday(permanentPedometer));

      intervalId = setInterval(() => {
        const nativeSteps = safeGetSteps(permanentPedometer);
        if (nativeSteps !== null) {
          void syncNativeSteps(nativeSteps, safeGetStepsBeforeToday(permanentPedometer));
        }
      }, 5000);

      if (isMounted) {
        setState({ isAvailable: true, permission: "granted", isWatching: true, error: null });
      }
      report({ kind: "counting" });

      return true;
    }

    async function startExpoPedometerFallback(): Promise<void> {
      const activityPermission = await requestAndroidActivityRecognitionPermission();
      if (activityPermission !== "granted") {
        if (isMounted) {
          setState({ isAvailable: true, permission: "denied", isWatching: false, error: null });
        }
        report({ kind: "permissionDenied", canAsk: activityPermission === "denied" });
        return;
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isMounted) return;

      setState((current) => ({ ...current, isAvailable, error: null }));

      if (!isAvailable) {
        report({ kind: "sensorUnavailable" });
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
        report({ kind: "permissionDenied", canAsk: permissionResponse.canAskAgain });
        return;
      }

      const baseTotalSteps = usePlayerStore.getState().progress.lapSteps;
      let baseStepsToday = usePedometerStore.getState().stepsToday;
      let lastSensorStepsToday = baseStepsToday;

      async function refreshTrackingNotification(stepsToday: number, totalSteps: number): Promise<void> {
        // Sans suivi permanent, pas de notification.
        if (!permanent) return;
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
        const liveStepsToday = usePedometerStore.getState().addLiveSteps(deltaSteps);
        const liveTotalSteps = progress.totalSteps + deltaSteps;

        await usePlayerStore.getState().syncFromSteps(liveTotalSteps, progress.streakDays, progress.lastActiveDateISO);

        const liveLapSteps = lapStepsOf(liveTotalSteps);
        if (shouldRefreshNotification(lastNotifiedDistanceBucketRef.current, liveLapSteps)) {
          lastNotifiedDistanceBucketRef.current = Math.floor(stepsToKm(liveLapSteps) * 100);
          await refreshTrackingNotification(liveStepsToday, liveLapSteps);
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
      report(isBackgroundOff ? { kind: "backgroundOff" } : { kind: "counting" });
    }

    async function startPedometer(): Promise<void> {
      report({ kind: "starting" });
      if (!enabled) {
        await clearPersistentTrackingNotificationAsync();
        return;
      }

      // Pas de capteur de pas dans un navigateur.
      if (Platform.OS === "web") {
        return;
      }

      try {
        if (permanent && ENABLE_NATIVE_FOREGROUND_SERVICE) {
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
        report({ kind: "error" });
      }
    }

    void startPedometer();

    return () => {
      isMounted = false;
      subscription?.remove();
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Le service ne s'arrête que si on désactive le suivi permanent : fermer l'app ne doit pas le couper.
      if (lastNativeStepsRef.current !== null && !permanentRef.current) {
        void safeStopTracking();
      }
      void clearPersistentTrackingNotificationAsync();
    };
  }, [enabled, permanent, attempt]);

  return state;
}
