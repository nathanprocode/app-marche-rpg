import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { CampTime } from "../../features/camp/campScene";

/**
 * Guts découpé dans les images du camp (mêmes pixels, fond transparent), posé exactement sur le Guts du décor.
 * Positions en fractions de la vignette, recadrée en 16:9 comme l'image de fond (« cover »).
 */
const GUTS = {
  // Le jour, le fond est camp-day-clean.jpg (Guts effacé) : Guts peut donc se déplacer un peu sans laisser de trace.
  day: {
    image: require("../../../assets/camp/guts-day.png"),
    frame: { left: "26.48%", top: "22.02%", width: "53.7%", height: "64.36%" },
    origin: "35% 100%",
  },
  // La nuit, Guts est aussi dans le fond : il ne fait que s'étirer vers le haut, pour le garder caché dessous.
  // L'épée reste dans le décor.
  night: {
    image: require("../../../assets/camp/guts-night.png"),
    frame: { left: "35.86%", top: "32.01%", width: "44.24%", height: "60.93%" },
    origin: "50% 79%",
  },
} as const;

/** Marche : durée de deux pas, hauteur du rebond (fraction de la hauteur de Guts), balancement (degrés). */
const WALK = { period: 1000, bounce: 0.022, sway: 1.2 };
/** Respiration : durée d'une inspiration, étirement maximal. */
const BREATH = { halfPeriod: 2000, stretch: 1.05 };

/** Échantillons d'une période, pour suivre une courbe (sinus) avec une interpolation linéaire. */
const SAMPLES = Array.from({ length: 17 }, (_, i) => i / 16);

type GutsIdleProps = {
  time: CampTime;
  /** Hauteur de la vignette, en px. */
  height: number;
};

/**
 * Guts sur la vignette du camp : il marche le jour (rebond et balancement à chaque pas), il respire la nuit.
 * Avec « Supprimer les animations », il reste immobile (le jour, il doit rester affiché : le fond n'a plus de Guts).
 */
export function GutsIdle({ time, height }: GutsIdleProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const guts = GUTS[time];

  useEffect(() => {
    if (reduceMotion) return;
    progress.setValue(0);
    const loop =
      time === "day"
        ? Animated.loop(
            Animated.timing(progress, { toValue: 1, duration: WALK.period, easing: Easing.linear, useNativeDriver: true }),
          )
        : Animated.loop(
            Animated.sequence(
              [1, 0].map((toValue) =>
                Animated.timing(progress, {
                  toValue,
                  duration: BREATH.halfPeriod,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ),
            ),
          );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, time, progress]);

  if (reduceMotion && time === "night") return null;

  let transform;
  if (reduceMotion) {
    transform = undefined;
  } else if (time === "day") {
    const bounce = WALK.bounce * height * 0.6436;
    transform = [
      {
        translateY: progress.interpolate({
          inputRange: SAMPLES,
          outputRange: SAMPLES.map((t) => -bounce * Math.abs(Math.sin(2 * Math.PI * t))),
        }),
      },
      {
        rotate: progress.interpolate({
          inputRange: SAMPLES,
          outputRange: SAMPLES.map((t) => `${WALK.sway * Math.sin(2 * Math.PI * t)}deg`),
        }),
      },
    ];
  } else {
    transform = [{ scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [1, BREATH.stretch] }) }];
  }

  return (
    <Animated.Image
      source={guts.image}
      resizeMode="stretch"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.sprite, guts.frame, { transformOrigin: guts.origin, transform }]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: { position: "absolute", pointerEvents: "none" },
});
