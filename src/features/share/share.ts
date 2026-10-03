import { Share } from "react-native";

/** Ouvre la feuille de partage du téléphone. Sans effet (et sans erreur) si elle est indisponible ou fermée. */
export async function shareMessage(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch (error) {
    console.log("[Share] unavailable", error);
  }
}
