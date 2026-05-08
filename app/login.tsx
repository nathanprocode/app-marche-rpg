import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../src/core/theme";
import { Screen } from "../src/ui/components/Screen";
import { signInFirebaseWithGoogleIdToken } from "../src/core/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "577122324982-dj909v3204i73sun7itrfkqm5icmb90a.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "577122324982-lst2maukmq6e6jjme8c2phfpkp9p2760.apps.googleusercontent.com";

export default function LoginRoute() {
  const [loading, setLoading] = useState(false);
  const forwardedParams = useLocalSearchParams();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    async function handleGoogleResponse() {
      if (!response) return;

      Alert.alert("Type de réponse", response.type);
      if (response.type !== "success") return;

      const idToken = response.params?.id_token;
      if (!idToken) {
        Alert.alert("Token manquant", JSON.stringify(response.params, null, 2));
        return;
      }

      setLoading(true);
      try {
        await signInFirebaseWithGoogleIdToken(idToken);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Alert.alert("Erreur Firebase", message);
      } finally {
        setLoading(false);
      }
    }

    void handleGoogleResponse();
  }, [response]);

  useEffect(() => {
    async function handleForwardedOAuthParams() {
      if (response || !Object.keys(forwardedParams).length) return;

      Alert.alert("Params OAuth transmis", JSON.stringify(forwardedParams, null, 2));

      const idTokenParam = forwardedParams.id_token;
      const idToken = Array.isArray(idTokenParam) ? idTokenParam[0] : idTokenParam;

      if (!idToken) {
        return;
      }

      setLoading(true);
      try {
        await signInFirebaseWithGoogleIdToken(idToken);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Alert.alert("Erreur Firebase", message);
      } finally {
        setLoading(false);
      }
    }

    void handleForwardedOAuthParams();
  }, [forwardedParams, response]);

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
