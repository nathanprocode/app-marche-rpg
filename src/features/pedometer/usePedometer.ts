import { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

type PedometerPermission = "granted" | "denied" | "undetermined";

type UsePedometerState = {
  isAvailable: boolean | null;
  permission: PedometerPermission;
  isWatching: boolean;
  error: string | null;
};

function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export function usePedometer(enabled = true): UsePedometerState {
  const [state, setState] = useState<UsePedometerState>({
    isAvailable: null,
    permission: "undetermined",
    isWatching: false,
    error: null,
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    async function startPedometer(): Promise<void> {
      if (!enabled) {
        return;
      }

      try {
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

        if (await Pedometer.isAvailableAsync()) {
          const todaySnapshot = await Pedometer.getStepCountAsync(getStartOfToday(), new Date());
          baseStepsToday = todaySnapshot.steps;
          usePedometerStore.getState().setLiveSteps(baseStepsToday);
        }

        subscription = Pedometer.watchStepCount(({ steps }: { steps: number }) => {
          const updatedAtISO = new Date().toISOString();
          const liveStepsToday = baseStepsToday + steps;
          const liveTotalSteps = baseTotalSteps + steps;

          usePedometerStore.getState().setLiveSteps(liveStepsToday, updatedAtISO);

          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = setTimeout(() => {
            const progress = usePlayerStore.getState().progress;
            void usePlayerStore
              .getState()
              .syncFromSteps(liveTotalSteps, progress.streakDays, progress.lastActiveDateISO);
          }, 1000);
        });

        if (isMounted) {
          setState((current) => ({ ...current, isWatching: true }));
        }
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled]);

  return state;
}
