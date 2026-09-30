import { Cinzel_800ExtraBold, useFonts } from "@expo-google-fonts/cinzel";

export const APP_HEADING_FONT_FAMILY = "Cinzel_800ExtraBold";

export function useAppFonts(): boolean {
  const [isLoaded] = useFonts({
    [APP_HEADING_FONT_FAMILY]: Cinzel_800ExtraBold,
  });

  return isLoaded;
}
