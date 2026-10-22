import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import type { CampTime } from "../../features/camp/campScene";

type CampAmbienceProps = {
  time: CampTime;
  /** Taille de la vignette, en px (les positions sont en fractions de cette taille). */
  width: number;
  height: number;
};

/**
 * Position du feu dans la vignette de nuit, en fraction de la largeur et de la hauteur.
 * Mesurée sur camp-night.jpg, recadrée en 16:9 (« cover » rogne un peu les côtés).
 */
const FIRE = { x: 0.24, y: 0.78 };

/** Braises : écart horizontal au départ (px), retard, durée, dérive latérale (px), taille (px). */
const EMBERS = [
  // À l'encre : des braises rouges et blanches en aplat, cernées de noir pour rester nettes même sur la flamme blanche.
  { dx: -4, delay: 0, duration: 2200, sway: 10, size: 5, color: "#E8414A" },
  { dx: 6, delay: 500, duration: 2600, sway: -8, size: 4, color: "#F3F3F0" },
  { dx: 0, delay: 1100, duration: 2000, sway: 6, size: 5, color: "#E8414A" },
  { dx: -8, delay: 1500, duration: 2900, sway: -12, size: 4, color: "#F3F3F0" },
  { dx: 3, delay: 1900, duration: 2400, sway: 14, size: 4, color: "#E8414A" },
  { dx: 9, delay: 800, duration: 3100, sway: -6, size: 5, color: "#E8414A" },
];

/** Trame de la lueur : écart entre les points et rayon du plus gros point (px). */
const GLOW_DOT_GAP = 7;
const GLOW_DOT_MAX_R = 2.2;
/** La trame laisse la flamme blanche intacte : elle commence à cette fraction du rayon. */
const GLOW_INNER = 0.22;
/**
 * Les états de la lueur : portée (fraction du rayon) et grain (graine du tirage des points). Le feu saute de l'un à
 * l'autre d'un coup, comme une trame qu'on change, au lieu de grossir et rétrécir d'un bloc.
 */
const GLOW_FRAMES = [
  { reach: 1, seed: 11 },
  { reach: 0.88, seed: 23 },
  { reach: 1.05, seed: 37 },
  { reach: 0.94, seed: 53 },
];
/** Suite des états et durée de chacun (ms) : des à-coups irréguliers, longs et courts mêlés, comme une flamme. */
const GLOW_FLICKER: [frame: number, ms: number][] = [
  [0, 220], [1, 90], [2, 140], [1, 70], [3, 180], [0, 110], [2, 260], [3, 80], [1, 130], [0, 170], [3, 100], [2, 90],
];

/** Feuilles : position de départ (fraction de la largeur), retard, durée, balancement (px), couleur. */
const LEAVES = [
  { x: 0.18, delay: 0, duration: 7000, sway: 14, color: "#111111" },
  { x: 0.52, delay: 2600, duration: 8200, sway: -12, color: "#4A4A47" },
  { x: 0.78, delay: 1200, duration: 6800, sway: 10, color: "#111111" },
  { x: 0.34, delay: 4300, duration: 7600, sway: -16, color: "#4A4A47" },
];

/** Une boucle infinie de 0 à 1, avec un retard de départ. */
function useLoop(duration: number, delay: number, enabled: boolean): Animated.Value {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const start = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [delay, duration, enabled, progress]);

  return progress;
}

function Ember({ ember, height, origin }: { ember: (typeof EMBERS)[number]; height: number; origin: { x: number; y: number } }) {
  const progress = useLoop(ember.duration, ember.delay, true);
  const rise = height * 0.55;

  return (
    <Animated.View
      style={[
        styles.particle,
        styles.ember,
        {
          left: origin.x + ember.dx,
          top: origin.y - height * 0.12,
          width: ember.size,
          height: ember.size,
          backgroundColor: ember.color,
          // Allumée ou éteinte, sans demi-teinte : un rouge à moitié transparent virerait au rose.
          opacity: progress.interpolate({ inputRange: [0, 0.04, 0.05, 0.9, 0.91, 1], outputRange: [0, 0, 1, 1, 0, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) },
            {
              translateX: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, ember.sway, ember.sway * 0.4],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Tirage fixe entre 0 et 1 pour un point et une graine : la trame d'un état ne change pas d'un rendu à l'autre. */
function grain(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Points de la trame autour du feu, sur une grille en quinconce : gros près de la flamme, de plus en plus fins
 * vers le bord, chacun un peu plus ou moins gros selon le grain de l'état. Pas de dégradé : le monde n'a que des
 * aplats et de la trame.
 */
function glowDots(size: number, frame: (typeof GLOW_FRAMES)[number]): { x: number; y: number; r: number }[] {
  const center = size / 2;
  const inner = center * GLOW_INNER;
  const outer = center * frame.reach;
  const dots: { x: number; y: number; r: number }[] = [];
  const rowGap = GLOW_DOT_GAP * 0.87;
  for (let row = 0; row * rowGap <= size; row++) {
    const y = row * rowGap;
    for (let x = row % 2 ? GLOW_DOT_GAP / 2 : 0; x <= size; x += GLOW_DOT_GAP) {
      const distance = Math.hypot(x - center, y - center);
      if (distance < inner) continue;
      const falloff = 1 - (distance - inner) / (outer - inner);
      const r = GLOW_DOT_MAX_R * falloff * (0.7 + 0.6 * grain(x, y, frame.seed));
      if (r >= 0.6) dots.push({ x, y, r: Math.min(r, GLOW_DOT_MAX_R) });
    }
  }
  return dots;
}

/**
 * Lueur du feu : quatre trames de points rouges pleins, une seule visible à la fois. Le feu passe de l'une à l'autre
 * par à-coups irréguliers ; ni zoom ni transparence (un rouge transparent virerait au rose).
 */
function FireGlow({ size, origin }: { size: number; origin: { x: number; y: number } }) {
  const frame = useRef(new Animated.Value(0)).current;
  const layers = useMemo(() => GLOW_FRAMES.map((glowFrame) => glowDots(size, glowFrame)), [size]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence(
        GLOW_FLICKER.map(([toValue, ms]) =>
          Animated.timing(frame, { toValue, duration: 0, delay: ms, useNativeDriver: true }),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [frame]);

  return (
    <View
      pointerEvents="none"
      style={[styles.glow, { left: origin.x - size / 2, top: origin.y - size / 2, width: size, height: size }]}
    >
      {layers.map((dots, i) => (
        <Animated.View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            {
              // Visible seulement quand la suite est sur cet état : tout ou rien.
              opacity: frame.interpolate({
                inputRange: [i - 0.5, i - 0.49, i + 0.49, i + 0.5],
                outputRange: [0, 1, 1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <Svg width={size} height={size}>
            {dots.map((dot, j) => (
              <Circle key={j} cx={dot.x} cy={dot.y} r={dot.r} fill="#E8414A" />
            ))}
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

function Leaf({ leaf, width, height }: { leaf: (typeof LEAVES)[number]; width: number; height: number }) {
  const progress = useLoop(leaf.duration, leaf.delay, true);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: leaf.x * width,
          top: -6,
          width: 4,
          height: 3,
          backgroundColor: leaf.color,
          opacity: progress.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height + 12] }) },
            {
              translateX: progress.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, leaf.sway, 0, -leaf.sway, 0],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/**
 * Animations discrètes posées sur la vignette du camp : braises et lueur du feu la nuit, feuilles le jour.
 * Rien ne bouge si « Supprimer les animations » est activé.
 */
export function CampAmbience({ time, width, height }: CampAmbienceProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || !width || !height) return null;

  const fire = { x: FIRE.x * width, y: FIRE.y * height };

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {time === "night" ? (
        <>
          <FireGlow size={height * 0.7} origin={fire} />
          {EMBERS.map((ember, i) => (
            <Ember key={i} ember={ember} height={height} origin={fire} />
          ))}
        </>
      ) : (
        LEAVES.map((leaf, i) => <Leaf key={i} leaf={leaf} width={width} height={height} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: "absolute" },
  ember: { borderWidth: 1, borderColor: "#111111" },
  glow: { position: "absolute" },
});
