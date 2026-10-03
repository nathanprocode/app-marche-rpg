import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import type { Companion } from "../../data/companions";
import { theme } from "../../core/theme";

type CompanionSpriteProps = {
  companion: Companion;
  size: number;
  /** Repeint le sprite d'une seule couleur (silhouette du compagnon pas encore rencontré). */
  tint?: string;
  style?: StyleProp<ImageStyle>;
};

/** Le sprite du compagnon, ou une silhouette générique tant que son pixel art n'existe pas. */
export function CompanionSprite({ companion, size, tint, style }: CompanionSpriteProps) {
  if (!companion.image) {
    return (
      <View
        accessible={false}
        style={[styles.placeholder, { width: size, height: size }]}
      >
        <Ionicons name="person" size={size * 0.7} color={tint ?? theme.colors.iron} />
      </View>
    );
  }

  return (
    <Image
      source={companion.image}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      tintColor={tint}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", opacity: 0.8 },
});
