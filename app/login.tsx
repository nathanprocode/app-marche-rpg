import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../src/core/theme";
import { Screen } from "../src/ui/components/Screen";
import { signInFirebaseWithGoogleIdToken } from "../src/core/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "577122324982-dj909v3204i73sun7itrfkqm5icmb90a.apps.googleusercontent.com";

export default function LoginRoute() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    async function handleGoogleResponse() {
      if (response?.type !== "success") return;
      const idToken = response.params.id_token;
      if (!idToken) return;

      setLoading(true);
      try {
        await signInFirebaseWithGoogleIdToken(idToken);
      } finally {
        setLoading(false);
      }
    }

    void handleGoogleResponse();
  }, [response]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Le serment d'acier commence ici.</Text>

        <Pressable
          disabled={!request || loading}
          style={[styles.googleBtn, (!request || loading) && styles.googleBtnDisabled]}
          onPress={() => void promptAsync()}
        >
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
  googleBtnDisabled: {
    opacity: 0.5,
  },
  googleBtnText: {
    color: theme.colors.text.primary,
    fontWeight: "700",
    fontSize: theme.typography.size.md,
    textAlign: "center",
  },
});
