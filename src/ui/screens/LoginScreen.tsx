import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";
import { Screen } from "../components/Screen";
import { useAuthStore } from "../../store/useAuthStore";

export function LoginScreen() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [loading, setLoading] = useState(false);

  async function onLogin(): Promise<void> {
    if (loading) return;
    setLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Traverse les ténèbres, un pas après l’autre.</Text>

        <Pressable onPress={() => void onLogin()} style={styles.googleBtn}>
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
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 36,
    fontWeight: theme.typography.weight.extraBold,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.md,
    textAlign: "center",
    lineHeight: 24,
  },
  googleBtn: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.bg.secondary,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  googleBtnText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    fontWeight: "700",
    textAlign: "center",
  },
});
