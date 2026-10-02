import { Animated, StyleSheet, View } from "react-native";
import { useWalkStep } from "./useWalkStep";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

const gutsMarkerAsset = require("../../../assets/map/guts-marker.png");
const SPRITE_WIDTH = 96;
const SPRITE_HEIGHT = 57;

/** Sprite du Traqué : posé juste au-dessus de sa position sur la carte, il avance à petits pas. */
export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  const step = useWalkStep();

  return (
    <View pointerEvents="none" style={[styles.marker, { left: `${xPct}%`, top: `${yPct}%` }]}>
      <Animated.Image
        accessibilityLabel="Position actuelle"
        source={gutsMarkerAsset}
        style={[styles.image, { transform: [{ translateY: step }] }]}
        resizeMode="contain"
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
  },
  image: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
  },
});
