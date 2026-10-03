import type { RefObject } from "react";
import type { View } from "react-native";
import { shareMessage } from "./share";

/** Taille de l'image envoyée : 4:5, adaptée aux stories et aux messageries. */
export const SHARE_IMAGE_WIDTH = 1080;
export const SHARE_IMAGE_HEIGHT = 1350;

/**
 * Photographie la carte et ouvre la feuille de partage avec l'image.
 * Si l'image est impossible (build installé sans les modules natifs, navigateur, partage refusé
 * par le système), on retombe sur le texte : l'utilisateur partage toujours quelque chose.
 */
export async function shareCardImage(cardRef: RefObject<View | null>, fallbackText: string): Promise<void> {
  let uri: string;
  try {
    // require dans le try : un build sans les modules natifs échoue ici, pas au démarrage de l'app.
    const { captureRef } = require("react-native-view-shot") as typeof import("react-native-view-shot");
    const Sharing = require("expo-sharing") as typeof import("expo-sharing");
    if (!cardRef.current || !(await Sharing.isAvailableAsync())) throw new Error("image sharing unavailable");

    uri = await captureRef(cardRef, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
    });
    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Partager" });
  } catch (error) {
    console.log("[Share] image unavailable, falling back to text", error);
    await shareMessage(fallbackText);
  }
}
