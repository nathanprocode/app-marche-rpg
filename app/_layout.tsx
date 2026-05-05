import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useAuthStore } from "../src/store/useAuthStore";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthResolved = useAuthStore((s) => s.isAuthResolved);
  const bindAuthListener = useAuthStore((s) => s.bindAuthListener);
  const segments = useSegments();
  const isOnLogin = segments[0] === "login";

  useEffect(() => {
    bindAuthListener();
  }, [bindAuthListener]);

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
