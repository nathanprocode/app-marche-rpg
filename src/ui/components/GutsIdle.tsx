import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, type ImageSourcePropType } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Defs, Ellipse, Image as SvgImage, Mask, RadialGradient, Stop } from "react-native-svg";
import type { CampTime } from "../../features/camp/campScene";

type GutsIdleProps = {
  time: CampTime;
  source: ImageSourcePropType;
  /** Taille de la vignette, en px. */
  width: number;
  height: number;
};

/** Zone de l'image qui bouge : ellipses en fractions de la vignette (image recadrée en 16:9). */
type Zone = { cx: number; cy: number; rx: number; ry: number };

/**
 * Guts fait partie de l'image du camp : on superpose une copie de l'image, visible seulement autour de lui
 * (bords fondus), et c'est cette copie qui bouge. Mesuré sur camp-day.jpg et camp-night.jpg.
 */
const MOTION = {
  // Le jour, il marche : la silhouette et l'épée montent et descendent au rythme du pas.
  day: {
    zones: [
      { cx: 0.42, cy: 0.52, rx: 0.17, ry: 0.4 },
      { cx: 0.62, cy: 0.35, rx: 0.2, ry: 0.1 },
    ],
    halfPeriod: 550,
  },
  // La nuit, il se repose : le buste se soulève lentement, comme une respiration.
  night: {
    zones: [{ cx: 0.54, cy: 0.53, rx: 0.14, ry: 0.3 }],
    halfPeriod: 2200,
  },
} satisfies Record<CampTime, { zones: Zone[]; halfPeriod: number }>;

/** Point fixe de la respiration (le bassin), en fraction de la hauteur. */
const NIGHT_ANCHOR_Y = 0.8;

/**
 * Petite animation de Guts sur la vignette du camp : pas de marche le jour, respiration la nuit.
 * Rien ne bouge si « Supprimer les animations » est activé.
 */
export function GutsIdle({ time, source, width, height }: GutsIdleProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const { zones, halfPeriod } = MOTION[time];
  const enabled = !reduceMotion && width > 0 && height > 0;

  useEffect(() => {
    if (!enabled) return;
    progress.setValue(0);
    const easing = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: halfPeriod, easing, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: halfPeriod, easing, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, halfPeriod, progress]);

  if (!enabled) return null;

  const motion =
    time === "day"
      ? { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.008] }) }] }
      : {
          transformOrigin: `50% ${NIGHT_ANCHOR_Y * 100}%`,
          transform: [{ scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] }) }],
        };

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, motion]}
    >
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="gutsIdleFade" cx="50%" cy="50%" r="50%">
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <Mask id="gutsIdleMask" maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            {zones.map((zone, i) => (
              <Ellipse
                key={i}
                cx={zone.cx * width}
                cy={zone.cy * height}
                rx={zone.rx * width}
                ry={zone.ry * height}
                fill="url(#gutsIdleFade)"
              />
            ))}
          </Mask>
        </Defs>
        {/* « slice » reproduit le recadrage « cover » de l'image de fond. */}
        <SvgImage
          href={source}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          mask="url(#gutsIdleMask)"
        />
      </Svg>
    </Animated.View>
  );
}
