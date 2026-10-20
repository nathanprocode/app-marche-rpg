import { useState } from "react";
import { Image, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { theme } from "../../core/theme";
import type { CampScene } from "../../features/camp/campScene";
import { CampAmbience } from "./CampAmbience";

// Versions encrées (noir et blanc contrasté) des scènes en pixel art, en attendant des scènes dessinées à l'encre.
const CAMP_IMAGES = {
  day: require("../../../assets/camp/camp-day-ink.jpg"),
  night: require("../../../assets/camp/camp-night-ink.jpg"),
};

const CAMP_DESCRIPTIONS = {
  day: "Guts marche sur un sentier en forêt, l'épée sur l'épaule.",
  night: "Guts se repose près d'un feu de camp, l'épée plantée à ses côtés.",
};

type CampVignetteProps = {
  scene: CampScene;
};

/**
 * Le camp : une fenêtre sur le monde, posée pleine largeur dans une case noire. Seules les braises restent en couleur.
 * La phrase d'ambiance suit l'heure et l'état de la Marque (voir features/camp/campScene).
 */
export function CampVignette({ scene }: CampVignetteProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  function handleWindowLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  return (
    <View>
      {/* Le ratio est porté par un conteneur : sur une image en largeur 100 %, le web l'ignore. */}
      <View style={styles.window} onLayout={handleWindowLayout}>
        <Image
          source={CAMP_IMAGES[scene.time]}
          style={styles.image}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={CAMP_DESCRIPTIONS[scene.time]}
          accessibilityIgnoresInvertColors
        />
        <CampAmbience time={scene.time} width={size.width} height={size.height} />
      </View>
      <Text style={styles.line}>{scene.line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  window: { width: "100%", aspectRatio: 16 / 9, overflow: "hidden" },
  // Taille explicite : sinon le web reprend la taille d'origine de l'image et la centre mal.
  image: { width: "100%", height: "100%" },
  line: { ...theme.text.small, color: theme.colors.paperSoft, padding: theme.space[16] },
});
