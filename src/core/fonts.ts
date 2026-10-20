import { useFonts } from "expo-font";
import { loadedFontFamilies } from "./theme/typography";

/** Charge les polices de l'app. Renvoie true quand elles sont prêtes. */
export function useAppFonts(): boolean {
  const [isLoaded] = useFonts({
    [loadedFontFamilies.mincho]: require("../../assets/fonts/ShipporiMinchoB1-ExtraBold.ttf"),
    [loadedFontFamilies.gothic]: require("../../assets/fonts/ZenKakuGothicNew-Regular.ttf"),
    [loadedFontFamilies.gothicBold]: require("../../assets/fonts/ZenKakuGothicNew-Bold.ttf"),
    [loadedFontFamilies.gothicBlack]: require("../../assets/fonts/ZenKakuGothicNew-Black.ttf"),
  });

  return isLoaded;
}
