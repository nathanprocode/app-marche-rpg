import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { AppState, Text, View } from "react-native";
import { useAppFonts } from "../src/core/fonts";
import { usePedometer } from "../src/features/pedometer/usePedometer";
import { parseSavedProgress } from "../src/features/progression/savedProgress";
import { runDailySync } from "../src/features/runtime/dailySync";
import { ensureUserDocAndLoad } from "../src/features/userCloud/service";
import { useAuthStore } from "../src/store/useAuthStore";
import { usePedometerStore } from "../src/store/usePedometerStore";
import { flushCloudSave, usePlayerStore } from "../src/store/usePlayerStore";
import { theme } from "../src/core/theme";
import { Button } from "../src/ui/components/Button";
import { CheckpointUnlockModal } from "../src/ui/components/CheckpointUnlockModal";

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  const [progressLoadError, setProgressLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isLocalStateLoaded, setIsLocalStateLoaded] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthResolved = useAuthStore((s) => s.isAuthResolved);
  const userId = useAuthStore((s) => s.userId);
  const bindAuthListener = useAuthStore((s) => s.bindAuthListener);
  const hydrateStepsTodayPreference = usePedometerStore((s) => s.hydrateStepsTodayPreference);
  const stepsToday = usePedometerStore((s) => s.stepsToday);
  const hydratePermanentTrackingPreference = usePlayerStore((s) => s.hydratePermanentTrackingPreference);
  const hydrateLocalProgress = usePlayerStore((s) => s.hydrateLocalProgress);
  const mergeCloudProgress = usePlayerStore((s) => s.mergeCloudProgress);
  const isPermanentTrackingEnabled = usePlayerStore((s) => s.isPermanentTrackingEnabled);
  const segments = useSegments();
  const isOnLogin = segments[0] === "login";
  const isOnOAuthRedirect = segments[0] === "oauthredirect";
  const isOnPublicAuthRoute = isOnLogin || isOnOAuthRedirect;

  // Les pas sont comptés dès la connexion ; l'interrupteur « Suivi permanent » ajoute le service en arrière-plan.
  usePedometer(
    isAuthResolved && isAuthenticated && isProgressLoaded && isLocalStateLoaded,
    isPermanentTrackingEnabled,
  );

  useEffect(() => {
    bindAuthListener();
  }, [bindAuthListener]);

  // Série et Marque : recalculées dès que l'état est chargé, puis à chaque changement de pas.
  useEffect(() => {
    if (isProgressLoaded && isLocalStateLoaded) {
      void runDailySync();
    }
  }, [isProgressLoaded, isLocalStateLoaded, stepsToday]);

  // Au retour au premier plan : on remet les pas à zéro si on a changé de jour, puis on recalcule.
  // En arrière-plan : on envoie la sauvegarde cloud en attente, l'app peut être tuée à tout moment.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        flushCloudSave();
        return;
      }
      if (nextState !== "active") return;
      void hydrateStepsTodayPreference().then(() => runDailySync());
    });

    return () => subscription.remove();
  }, [hydrateStepsTodayPreference]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateLocalState(): Promise<void> {
      await Promise.all([hydratePermanentTrackingPreference(), hydrateStepsTodayPreference()]);
      if (isMounted) {
        setIsLocalStateLoaded(true);
      }
    }

    void hydrateLocalState();

    return () => {
      isMounted = false;
    };
  }, [hydratePermanentTrackingPreference, hydrateStepsTodayPreference]);

  // Progression : la sauvegarde locale d'abord (démarrage immédiat, même hors ligne),
  // puis Firestore en arrière-plan, fusionné avec ce qui a été compté entre-temps.
  useEffect(() => {
    let isCurrent = true;

    async function loadProgress(): Promise<void> {
      setIsProgressLoaded(false);
      setProgressLoadError(null);
      if (!isAuthenticated || !userId) return;

      const hasLocal = await hydrateLocalProgress(userId);
      if (!isCurrent) return;
      if (hasLocal) setIsProgressLoaded(true);

      try {
        const userName = useAuthStore.getState().userName ?? "Traqué";
        const cloudDoc = await ensureUserDocAndLoad(userId, userName);
        if (!isCurrent) return;

        const cloud = parseSavedProgress({
          ...cloudDoc.progression,
          unlockedCheckpoints: cloudDoc.unlockedCheckpoints,
          updatedAtISO: cloudDoc.updatedAtISO,
        });
        if (cloud) await mergeCloudProgress(cloud);
        if (isCurrent) setIsProgressLoaded(true);
      } catch (error) {
        console.log("[RootLayout] cloud progress unavailable", error);
        // Avec une sauvegarde locale, on continue sans le cloud. Sans elle (première connexion sur
        // ce téléphone), il faut le réseau : démarrer à zéro écraserait la progression du cloud.
        if (isCurrent && !hasLocal) {
          setProgressLoadError("Impossible de récupérer ta progression. Vérifie ta connexion.");
        }
      }
    }

    void loadProgress();

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, userId, loadAttempt, hydrateLocalProgress, mergeCloudProgress]);

  if (!fontsLoaded || !isAuthResolved) {
    return <CenteredMessage message="Chargement de la session..." />;
  }

  if (!isAuthenticated && !isOnPublicAuthRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isOnPublicAuthRoute) return <Redirect href="/(tabs)" />;

  if (isAuthenticated && !isProgressLoaded) {
    return (
      <CenteredMessage message={progressLoadError ?? "Chargement de la progression..."}>
        {progressLoadError ? (
          <Button label="Réessayer" onPress={() => setLoadAttempt((attempt) => attempt + 1)} />
        ) : null}
      </CenteredMessage>
    );
  }

  return (
    <>
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="oauthredirect" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <CheckpointUnlockModal enabled={isAuthenticated && isProgressLoaded} />
    </>
  );
}

function CenteredMessage({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: theme.space[24],
        padding: theme.space[24],
        backgroundColor: theme.colors.ink,
      }}
    >
      <Text style={{ ...theme.text.body, color: theme.colors.boneDim, textAlign: "center" }}>{message}</Text>
      {children}
    </View>
  );
}
