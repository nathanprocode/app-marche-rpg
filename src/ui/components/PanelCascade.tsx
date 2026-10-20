import { useFocusEffect } from "expo-router";
import { Children, isValidElement, useCallback, useRef, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/** Durée d'apparition d'une case, écart entre deux cases et nombre de cases décalées (les suivantes partent ensemble). */
const DURATION_MS = 220;
const STAGGER_MS = 45;
const MAX_STAGGERED = 6;
/** Les cases montent de quelques pixels en apparaissant. */
const RISE_PX = 10;

/**
 * La planche se remplit : à chaque arrivée sur l'écran, ses cases apparaissent l'une après l'autre, en fondu
 * et en remontant à peine. Rien ne bouge si « Supprimer les animations » est activé.
 */
export function PanelCascade({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const panels = Children.toArray(children);
  const progress = useRef<Animated.Value[]>([]);
  while (progress.current.length < panels.length) progress.current.push(new Animated.Value(reduceMotion ? 1 : 0));

  useFocusEffect(
    useCallback(() => {
      const values = progress.current;
      if (reduceMotion) {
        values.forEach((value) => value.setValue(1));
        return;
      }
      values.forEach((value) => value.setValue(0));
      const animation = Animated.parallel(
        values.map((value, i) =>
          Animated.timing(value, {
            toValue: 1,
            duration: DURATION_MS,
            delay: Math.min(i, MAX_STAGGERED) * STAGGER_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      );
      animation.start();
      return () => animation.stop();
    }, [reduceMotion]),
  );

  return panels.map((panel, i) => {
    const value = progress.current[i];
    return (
      <Animated.View
        // La clé donnée par Children.toArray suit la place de la case dans l'écran, même si une case conditionnelle manque.
        key={isValidElement(panel) && panel.key != null ? panel.key : i}
        style={{
          opacity: value,
          transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [RISE_PX, 0] }) }],
        }}
      >
        {panel}
      </Animated.View>
    );
  });
}
