import { Animated, StyleSheet, View } from "react-native";
import type { Companion } from "../../data/companions";
import { useWalkStep } from "./useWalkStep";

type CompanionMarkerProps = {
  companion: Companion;
  /** Position de Guts sur la carte, en %. */
  xPct: number;
  yPct: number;
  /** Décalage horizontal par rapport à Guts, en px (voir layoutTroupe). */
  offsetX: number;
  /** Rang dans la troupe : décale son pas pour que tout le monde ne sautille pas en même temps. */
  index: number;
};

export const COMPANION_SPRITE_SIZE = 44;
/** Même écart que GutsMarker : les pieds de tout le monde sont sur la même ligne. */
const FEET_GAP = 6;

/** Un compagnon qui marche aux côtés de Guts sur la carte. */
export function CompanionMarker({ companion, xPct, yPct, offsetX, index }: CompanionMarkerProps) {
  const step = useWalkStep((index + 1) * 130);

  return (
    <View
      pointerEvents="none"
      style={[styles.marker, { left: `${xPct}%`, top: `${yPct}%`, transform: [{ translateX: offsetX }] }]}
    >
      <Animated.Image
        accessibilityLabel={companion.name}
        source={companion.image}
        style={[styles.image, { transform: [{ translateY: step }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    width: COMPANION_SPRITE_SIZE,
    height: COMPANION_SPRITE_SIZE,
    marginLeft: -COMPANION_SPRITE_SIZE / 2,
    marginTop: -COMPANION_SPRITE_SIZE - FEET_GAP,
  },
  image: { width: COMPANION_SPRITE_SIZE, height: COMPANION_SPRITE_SIZE },
});
