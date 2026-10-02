import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
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
  { dx: -4, delay: 0, duration: 2200, sway: 10, size: 3, color: "#FFB347" },
  { dx: 6, delay: 500, duration: 2600, sway: -8, size: 2, color: "#FF7A1A" },
  { dx: 0, delay: 1100, duration: 2000, sway: 6, size: 3, color: "#FFD27A" },
  { dx: -8, delay: 1500, duration: 2900, sway: -12, size: 2, color: "#FF7A1A" },
  { dx: 3, delay: 1900, duration: 2400, sway: 14, size: 2, color: "#FFB347" },
  { dx: 9, delay: 800, duration: 3100, sway: -6, size: 3, color: "#FF9A2E" },
];

/** Feuilles : position de départ (fraction de la largeur), retard, durée, balancement (px), couleur. */
const LEAVES = [
  { x: 0.18, delay: 0, duration: 7000, sway: 14, color: "#6B8E23" },
  { x: 0.52, delay: 2600, duration: 8200, sway: -12, color: "#8B5A2B" },
  { x: 0.78, delay: 1200, duration: 6800, sway: 10, color: "#556B2F" },
  { x: 0.34, delay: 4300, duration: 7600, sway: -16, color: "#A0782C" },
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
        {
          left: origin.x + ember.dx,
          top: origin.y - height * 0.12,
          width: ember.size,
          height: ember.size,
          backgroundColor: ember.color,
          opacity: progress.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
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

/** Lueur du feu : une tache orangée dont l'intensité vacille de façon irrégulière. */
function FireGlow({ size, origin }: { size: number; origin: { x: number; y: number } }) {
  const flicker = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const steps = [0.62, 0.4, 0.55, 0.35, 0.6, 0.48];
    const durations = [140, 90, 170, 110, 130, 160];
    const loop = Animated.loop(
      Animated.sequence(
        steps.map((toValue, i) =>
          Animated.timing(flicker, { toValue, duration: durations[i], easing: Easing.linear, useNativeDriver: true }),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  return (
    <Animated.View
      style={[
        styles.glow,
        { left: origin.x - size / 2, top: origin.y - size / 2, width: size, height: size, opacity: flicker },
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF9A2E" stopOpacity="0.9" />
            <Stop offset="0.5" stopColor="#FF6A00" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#FF6A00" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#fireGlow)" />
      </Svg>
    </Animated.View>
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
  glow: { position: "absolute" },
});
