import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../src/core/theme";
import { Screen } from "../src/ui/components/Screen";
import { useAuthStore } from "../src/store/useAuthStore";
import "../src/core/firebase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginRoute() {
  const setAuthenticatedUser = useAuthStore((s) => s.setAuthenticatedUser);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn(): Promise<void> {
    setLoading(true);
    try {
      // Sprint 1: placeholder UI/routing validation.
      // Sprint 2: remplacer par le vrai flux AuthSession + Firebase Google provider.
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAuthenticatedUser("Épéiste Noir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Le serment d'acier commence ici.</Text>

        <Pressable style={styles.googleBtn} onPress={() => void handleGoogleSignIn()}>
          {loading ? (
            <ActivityIndicator color={theme.colors.text.primary} />
          ) : (
            <Text style={styles.googleBtnText}>Se connecter avec Google</Text>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.md,
    textAlign: "center",
  },
  googleBtn: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  googleBtnText: {
    color: theme.colors.text.primary,
    fontWeight: "700",
    fontSize: theme.typography.size.md,
    textAlign: "center",
  },
});
