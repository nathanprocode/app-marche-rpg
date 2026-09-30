import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Alert, StyleSheet, Text, View } from "react-native";
import { signInFirebaseWithGoogleIdToken } from "../src/core/firebase";
import { theme } from "../src/core/theme";
import { BrandMark } from "../src/ui/components/BrandMark";
import { Button } from "../src/ui/components/Button";
import { Screen } from "../src/ui/components/Screen";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "577122324982-dj909v3204i73sun7itrfkqm5icmb90a.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "577122324982-lst2maukmq6e6jjme8c2phfpkp9p2760.apps.googleusercontent.com";

function showFirebaseError(error: unknown): void {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  Alert.alert("Connexion impossible", message);
}

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
      if (!response || response.type !== "success") return;

      const idToken = response.params?.id_token;
      if (!idToken) {
        Alert.alert("Connexion impossible", "Google n'a pas renvoyé de jeton d'identité.");
        return;
      }

      setLoading(true);
      try {
        await signInFirebaseWithGoogleIdToken(idToken);
      } catch (error) {
        showFirebaseError(error);
      } finally {
        setLoading(false);
      }
    }

    void handleGoogleResponse();
  }, [response]);

  useEffect(() => {
    async function handleForwardedOAuthParams() {
      if (response || !Object.keys(forwardedParams).length) return;

      const idTokenParam = forwardedParams.id_token;
      const idToken = Array.isArray(idTokenParam) ? idTokenParam[0] : idTokenParam;

      if (!idToken) {
        return;
      }

      setLoading(true);
      try {
        await signInFirebaseWithGoogleIdToken(idToken);
      } catch (error) {
        showFirebaseError(error);
      } finally {
        setLoading(false);
      }
    }

    void handleForwardedOAuthParams();
  }, [forwardedParams, response]);

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.container}>
        <BrandMark visual={{ state: "active", intensity: 0.5 }} width={64} />
        <Text accessibilityRole="header" style={styles.title}>
          Marche du Faucon
        </Text>
        <Text style={styles.subtitle}>Le serment d'acier commence ici.</Text>

        <View style={styles.action}>
          <Button label="Se connecter avec Google" onPress={() => void promptAsync()} disabled={!request} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: theme.space[16] },
  title: { ...theme.text.displayL, color: theme.colors.bone, textAlign: "center", marginTop: theme.space[16], alignSelf: "stretch" },
  subtitle: {
    ...theme.text.body,
    fontFamily: theme.fontFamily.bodyItalic,
    color: theme.colors.boneDim,
    textAlign: "center",
  },
  action: { alignSelf: "stretch", marginTop: theme.space[32] },
});
