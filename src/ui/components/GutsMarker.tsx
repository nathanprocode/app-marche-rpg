import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

const gutsMarkerAsset = require("../../../assets/map/guts-marker.png");

export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
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
    <View style={[styles.marker, { left: `${xPct * 100}%`, top: `${yPct * 100}%` }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image source={gutsMarkerAsset} style={styles.image} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
