import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { CampTime } from "../../features/camp/campScene";
import { useWalkStep } from "./useWalkStep";

const GUTS_IMAGES = {
  day: require("../../../assets/camp/guts-day.png"),
  night: require("../../../assets/camp/guts-night.png"),
};

/**
 * Où se trouve Guts dans chaque image (en pixels de l'image d'origine, 1080 px de large) : la copie découpée de Guts
 * se pose exactement au-dessus de l'original, qui reste dessous. Un petit mouvement ne laisse donc rien voir derrière.
 */
const GUTS_BOX = {
  day: { image: { width: 1080, height: 810 }, x: 294, y: 236, width: 570, height: 388 },
  night: { image: { width: 1080, height: 581 }, x: 396, y: 195, width: 383, height: 344 },
};

/** Taille de l'image d'origine d'une scène, pour que le décor et Guts partagent le même cadrage. */
export function campImageSize(time: CampTime): { width: number; height: number } {
  return GUTS_BOX[time].image;
}

type CampGutsProps = {
  time: CampTime;
  /** Taille de l'image affichée (déjà mise à l'échelle), en px. */
  stageWidth: number;
  stageHeight: number;
};

/** Respiration lente : une valeur qui monte et redescend, en boucle. */
function useBreath(durationMs: number): Animated.Value {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: durationMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, durationMs]);

  return breath;
}

/** Lueur du feu sur Guts : même vacillement irrégulier que la flamme (voir CampAmbience). */
function useFireLight(): Animated.Value {
  const light = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    const steps = [0.17, 0.05, 0.13, 0.03, 0.16, 0.08];
    const durations = [140, 90, 170, 110, 130, 160];
    const loop = Animated.loop(
      Animated.sequence(
        steps.map((toValue, i) =>
          Animated.timing(light, { toValue, duration: durations[i], easing: Easing.linear, useNativeDriver: true }),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [light]);

  return light;
}

/** Le jour : Guts marche sur place, avec le même petit pas que les compagnons sur la carte. */
function DayGuts({ box }: { box: { left: number; top: number; width: number; height: number } }) {
  const step = useWalkStep(0);

  return (
    <Animated.Image
      source={GUTS_IMAGES.day}
      resizeMode="stretch"
      style={[styles.sprite, box, { transform: [{ translateY: step }] }]}
    />
  );
}

/** La nuit : Guts respire lentement, et la lueur du feu vacille sur lui. */
function NightGuts({ box }: { box: { left: number; top: number; width: number; height: number } }) {
  const breath = useBreath(2300);
  const fireLight = useFireLight();
  // Mise à l'échelle verticale autour du bas du corps : les pieds ne bougent pas, le torse monte un peu.
  const grow = 0.014;
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + grow] });
  const lift = breath.interpolate({ inputRange: [0, 1], outputRange: [0, (-box.height * grow) / 2] });
  const transform = [{ translateY: lift }, { scaleY }];

  return (
    <>
      <Animated.Image source={GUTS_IMAGES.night} resizeMode="stretch" style={[styles.sprite, box, { transform }]} />
      <Animated.Image
        source={GUTS_IMAGES.night}
        resizeMode="stretch"
        tintColor="#FF8A2A"
        style={[styles.sprite, box, { transform, opacity: fireLight }]}
      />
    </>
  );
}

/**
 * Guts, animé très discrètement par-dessus l'image du camp (voir GUTS_BOX).
 * Rien ne bouge si « Supprimer les animations » est activé : on garde alors l'image seule.
 */
export function CampGuts({ time, stageWidth, stageHeight }: CampGutsProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || !stageWidth || !stageHeight) return null;

  const { image, x, y, width, height } = GUTS_BOX[time];
  const box = {
    left: (x / image.width) * stageWidth,
    top: (y / image.height) * stageHeight,
    width: (width / image.width) * stageWidth,
    height: (height / image.height) * stageHeight,
  };

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {time === "night" ? <NightGuts box={box} /> : <DayGuts box={box} />}
    </View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: "absolute" },
});
