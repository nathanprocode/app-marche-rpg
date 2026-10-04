import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { CampTime } from "../../features/camp/campScene";

/**
 * Guts découpé dans les images du camp (mêmes pixels, fond transparent), posé exactement sur le Guts du décor.
 * Positions en fractions de la vignette, recadrée en 16:9 comme l'image de fond (« cover »).
 * Il ne fait que grandir (échelle ≥ 1) : le Guts du décor reste toujours caché dessous.
 */
const GUTS = {
  // Le jour, il marche : petit rebond à chaque pas, ancré aux pieds.
  day: {
    image: require("../../../assets/camp/guts-day.png"),
    frame: { left: "26.48%", top: "22.02%", width: "53.7%", height: "64.36%" },
    origin: "50% 100%",
    stretch: 1.03,
    halfPeriod: 380,
  },
  // La nuit, il se repose : le buste se soulève lentement, ancré au bassin. L'épée reste dans le décor.
  night: {
    image: require("../../../assets/camp/guts-night.png"),
    frame: { left: "35.86%", top: "32.01%", width: "44.24%", height: "60.93%" },
    origin: "50% 79%",
    stretch: 1.05,
    halfPeriod: 2000,
  },
} as const;

/**
 * Petite animation de Guts sur la vignette du camp : pas de marche le jour, respiration la nuit.
 * Rien ne bouge si « Supprimer les animations » est activé.
 */
export function GutsIdle({ time }: { time: CampTime }) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const guts = GUTS[time];

  useEffect(() => {
    if (reduceMotion) return;
    progress.setValue(0);
    const easing = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: guts.halfPeriod, easing, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: guts.halfPeriod, easing, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, guts.halfPeriod, progress]);

  if (reduceMotion) return null;

  return (
    <Animated.Image
      source={guts.image}
      resizeMode="stretch"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.sprite,
        guts.frame,
        {
          transformOrigin: guts.origin,
          transform: [{ scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [1, guts.stretch] }) }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: { position: "absolute", pointerEvents: "none" },
});
