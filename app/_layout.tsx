import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAppFonts } from "../src/core/fonts";
import { usePedometer } from "../src/features/pedometer/usePedometer";
import { ensureUserDocAndLoad } from "../src/features/userCloud/service";
import { useAuthStore } from "../src/store/useAuthStore";
import { useBrandStore } from "../src/store/useBrandStore";
import { usePedometerStore } from "../src/store/usePedometerStore";
import { usePlayerStore } from "../src/store/usePlayerStore";
import { CheckpointUnlockToast } from "../src/ui/components/CheckpointUnlockToast";

export default function RootLayout() {
  useAppFonts();

  const [isCloudStateLoaded, setIsCloudStateLoaded] = useState(false);
  const [isLocalStateLoaded, setIsLocalStateLoaded] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthResolved = useAuthStore((s) => s.isAuthResolved);
  const userId = useAuthStore((s) => s.userId);
  const userName = useAuthStore((s) => s.userName);
  const bindAuthListener = useAuthStore((s) => s.bindAuthListener);
  const hydrateStepsTodayPreference = usePedometerStore((s) => s.hydrateStepsTodayPreference);
  const hydratePermanentTrackingPreference = usePlayerStore((s) => s.hydratePermanentTrackingPreference);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setUnlockedCheckpoints = usePlayerStore((s) => s.setUnlockedCheckpoints);
  const isPermanentTrackingEnabled = usePlayerStore((s) => s.isPermanentTrackingEnabled);
  const segments = useSegments();
  const isOnLogin = segments[0] === "login";
  const isOnOAuthRedirect = segments[0] === "oauthredirect";
  const isOnPublicAuthRoute = isOnLogin || isOnOAuthRedirect;

  usePedometer(
    isAuthResolved &&
      isAuthenticated &&
      isCloudStateLoaded &&
      isLocalStateLoaded &&
      isPermanentTrackingEnabled,
  );

  useEffect(() => {
    bindAuthListener();
  }, [bindAuthListener]);

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

  useEffect(() => {
    console.log("🔥 [LAYOUT] Cloud load effect", { isAuthenticated, userId, userName });
    async function loadCloudState() {
      if (!isAuthenticated || !userId) {
        setIsCloudStateLoaded(false);
        return;
      }
      const cloudDoc = await ensureUserDocAndLoad(userId, userName ?? "Traqué");
      console.log("🔥 [LAYOUT] Cloud doc loaded", cloudDoc);
      setProgress(cloudDoc.progression);
      setUnlockedCheckpoints(cloudDoc.unlockedCheckpoints);

      useBrandStore.setState((prev) => ({
        status: {
          ...prev.status,
          visual: { ...prev.status.visual, intensity: cloudDoc.brandIntensity },
        },
      }));
      setIsCloudStateLoaded(true);
    }

    void loadCloudState();
  }, [isAuthenticated, userId, userName, setProgress, setUnlockedCheckpoints]);

  if (!isAuthResolved) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B0B0D" }}>
        <Text style={{ color: "#E5E7EB" }}>Chargement de la session...</Text>
      </View>
    );
  }

  if (!isAuthenticated && !isOnPublicAuthRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isOnPublicAuthRoute) return <Redirect href="/(tabs)" />;

  return (
    <>
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="oauthredirect" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="quests" />
        <Stack.Screen name="gallery" />
      </Stack>
      <CheckpointUnlockToast enabled={isAuthenticated && isCloudStateLoaded} />
    </>
  );
}
