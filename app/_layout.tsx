import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { ensureUserDocAndLoad } from "../src/features/userCloud/service";
import { useAuthStore } from "../src/store/useAuthStore";
import { useBrandStore } from "../src/store/useBrandStore";
import { usePlayerStore } from "../src/store/usePlayerStore";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthResolved = useAuthStore((s) => s.isAuthResolved);
  const userId = useAuthStore((s) => s.userId);
  const userName = useAuthStore((s) => s.userName);
  const bindAuthListener = useAuthStore((s) => s.bindAuthListener);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const segments = useSegments();
  const isOnLogin = segments[0] === "login";

  useEffect(() => {
    bindAuthListener();
  }, [bindAuthListener]);

  useEffect(() => {
    async function loadCloudState() {
      if (!isAuthenticated || !userId) return;
      const cloudDoc = await ensureUserDocAndLoad(userId, userName ?? "Traqué");
      setProgress(cloudDoc.progression);

      useBrandStore.setState((prev) => ({
        status: {
          ...prev.status,
          visual: { ...prev.status.visual, intensity: cloudDoc.brandIntensity },
        },
      }));
    }

    void loadCloudState();
  }, [isAuthenticated, userId, userName, setProgress]);

  if (!isAuthResolved) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B0B0D" }}>
        <Text style={{ color: "#E5E7EB" }}>Chargement de la session...</Text>
      </View>
    );
  }

  if (!isAuthenticated && !isOnLogin) return <Redirect href="/login" />;
  if (isAuthenticated && isOnLogin) return <Redirect href="/(tabs)" />;

  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="quests" />
    </Stack>
  );
}
