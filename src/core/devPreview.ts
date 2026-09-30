import { Platform } from "react-native";

/**
 * Mode test réservé au développement : ouvrir http://localhost:8081/?devpreview dans le navigateur.
 * Aucune connexion Google, aucun accès à Firestore, données fictives.
 * Toujours désactivé dans un vrai build (__DEV__ est faux) et sur téléphone.
 */
export const DEV_PREVIEW_UID = "dev-preview";

function detectDevPreview(): boolean {
  if (!__DEV__ || Platform.OS !== "web" || typeof window === "undefined") return false;
  return window.location.search.includes("devpreview");
}

// Lu une seule fois au chargement : la navigation interne efface l'adresse d'origine.
export const isDevPreview: boolean = detectDevPreview();
