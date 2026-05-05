import { Redirect, Stack, useSegments } from "expo-router";
import { useAuthStore } from "../src/store/useAuthStore";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const isOnLogin = segments[0] === "login";

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
