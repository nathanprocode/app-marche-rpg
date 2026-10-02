import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/** Durée d'un pas : le sprite reste posé, puis soulevé, chacun pendant ce temps. */
const STEP_MS = 240;
/** Hauteur du sautillement, en px. */
export const WALK_STEP_HEIGHT = 2;

/**
 * Sautillement de marche « pixel art » : deux positions franches (posé / soulevé), sans transition douce,
 * comme une animation à deux images. Renvoie un translateY à appliquer au sprite.
 * Immobile si « Supprimer les animations » est activé.
 *
 * @param delayMs décalage de départ, pour que les compagnons ne marchent pas tous au même pas.
 */
export function useWalkStep(delayMs = 0): Animated.Value {
  const offset = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      offset.setValue(0);
      return;
    }

    const lifted = -WALK_STEP_HEIGHT;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(offset, { toValue: lifted, duration: 0, useNativeDriver: true }),
        Animated.delay(STEP_MS),
        Animated.timing(offset, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(STEP_MS),
      ]),
    );
    const start = setTimeout(() => loop.start(), delayMs);

    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [delayMs, offset, reduceMotion]);

  return offset;
}
