import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

const gutsMarkerAsset = require("../../../assets/map/guts-marker.png");
const SPRITE_WIDTH = 96;
const SPRITE_HEIGHT = 57;

/** Sprite du Traqué : posé juste au-dessus de sa position sur la carte. */
export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View pointerEvents="none" style={[styles.marker, { left: `${xPct}%`, top: `${yPct}%` }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          accessibilityLabel="Position actuelle"
          source={gutsMarkerAsset}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
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
