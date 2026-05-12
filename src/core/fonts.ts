import { useFonts } from "@expo-google-fonts/cinzel/useFonts";
import { Cinzel_800ExtraBold } from "@expo-google-fonts/cinzel/800ExtraBold";

export const APP_HEADING_FONT_FAMILY = "Cinzel_800ExtraBold";

export function useAppFonts(): boolean {
  const [isLoaded] = useFonts({
    [APP_HEADING_FONT_FAMILY]: Cinzel_800ExtraBold,
  });

  return isLoaded;
}
