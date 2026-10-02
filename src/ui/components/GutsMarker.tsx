import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

/** Planche de marche : 8 images de 124 x 131 px côte à côte (assets/map/guts-walk.png). */
const walkSheet = require("../../../assets/map/guts-walk.png");
const FRAME_COUNT = 8;
const SOURCE_FRAME = { width: 124, height: 131 };
/** Taille affichée sur la carte. */
const SPRITE_HEIGHT = 64;
const SPRITE_WIDTH = Math.round((SOURCE_FRAME.width / SOURCE_FRAME.height) * SPRITE_HEIGHT);
/** Durée d'une image : un cycle complet de marche en 0,8 s. */
const FRAME_MS = 100;

/**
 * Le Traqué sur la carte, qui marche en boucle : la planche glisse d'une image à l'autre derrière une fenêtre
 * de la taille d'une image, par sauts francs comme une vraie animation pixel art.
 * Immobile (première image) si « Supprimer les animations » est activé.
 */
export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  const reduceMotion = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      offset.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence(
        Array.from({ length: FRAME_COUNT }, (_, frame) => [
          Animated.timing(offset, { toValue: -frame * SPRITE_WIDTH, duration: 0, useNativeDriver: true }),
          Animated.delay(FRAME_MS),
        ]).flat(),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [offset, reduceMotion]);

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel="Position actuelle"
      style={[styles.marker, { left: `${xPct}%`, top: `${yPct}%` }]}
    >
      <Animated.Image
        source={walkSheet}
        resizeMode="stretch"
        style={[styles.sheet, { transform: [{ translateX: offset }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    marginLeft: -SPRITE_WIDTH / 2,
    marginTop: -SPRITE_HEIGHT - 6,
    overflow: "hidden",
  },
  sheet: { width: SPRITE_WIDTH * FRAME_COUNT, height: SPRITE_HEIGHT },
});
