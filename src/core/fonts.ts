import { PirataOne_400Regular } from "@expo-google-fonts/pirata-one/400Regular";
import { useFonts } from "@expo-google-fonts/pirata-one/useFonts";
import { Spectral_400Regular } from "@expo-google-fonts/spectral/400Regular";
import { Spectral_400Regular_Italic } from "@expo-google-fonts/spectral/400Regular_Italic";
import { Spectral_600SemiBold } from "@expo-google-fonts/spectral/600SemiBold";
import { SpectralSC_600SemiBold } from "@expo-google-fonts/spectral-sc/600SemiBold";
import { fontFamily } from "./theme/typography";

/** Charge les polices de l'app. Renvoie true quand elles sont prêtes. */
export function useAppFonts(): boolean {
  const [isLoaded] = useFonts({
    [fontFamily.display]: PirataOne_400Regular,
    [fontFamily.body]: Spectral_400Regular,
    [fontFamily.bodyItalic]: Spectral_400Regular_Italic,
    [fontFamily.bodyStrong]: Spectral_600SemiBold,
    [fontFamily.label]: SpectralSC_600SemiBold,
  });

  return isLoaded;
}
