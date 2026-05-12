import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../../core/theme";
import type { BrandVisualState } from "../../features/brandOfSacrifice/types";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BRAND_MARK_MAIN_PATH =
  "m92.12 21.47 4.39.83a.52.52 0 0 0 .55-.76Q92.87 13.7 91.2 5.06q-.29-1.47-1.55-4.31a.4.39 57.5 0 0-.61-.14c-2.71 2.34-4.45 4.92-4.26 8.79q.44 8.89-4.86 16.3a.53.53 0 0 1-.79.08L66.21 13.55a.42.41-47.3 0 0-.6.03c-2.97 3.4-3.64 7.28-1.08 11.26C72.32 36.93 80.36 55.44 80.46 70c.1 14.24.94 29.18-1.53 43.24a.65.64 12.6 0 1-.81.51l-4.7-1.29a.9.89 4.1 0 1-.65-.74c-.93-6.72-7.15-8.89-11.54-13.18-4.36-4.27-4.95-8.45-11.4-11.38a1.7 1.66-.8 0 1-.77-.73l-5.28-10.06a1.37 1.36-4.9 0 0-.8-.67q-4.07-1.28-8.37-1.38a1.27 1.26-19.7 0 1-.94-.44q-5.04-5.68-7.34-12.93a1.02 1.01-36.8 0 1 .13-.88c6.15-8.84 14.68-15.45 22.45-22.53a.63.62-36.4 0 0 .12-.77c-3.42-5.8-13.64-14.27-19.74-6.72-5.93 7.36-11.75 11.28-19.21 16.78Q5.97 49.86.53 57.85a.84.83-42.6 0 0-.04.86q4.66 8.33 8.65 11.65c10.6 8.78 21.29 17.66 28.15 29.83q.91 1.63 5.16 5.62a1.62 1.61-19.5 0 0 .87.41q5.52.76 8 3.97 9.97 12.86 19.76 25.93a1.21 1.19-57.7 0 1 .21.96q-1.53 6.86-4.22 13.36a1.41 1.41 0 0 1-.7.73q-8.48 3.92-11.98 7.47-9.65 9.79-20.44 18.28c-5.07 3.99-8.38 7.5-11.94 12.3-5.05 6.82-10.37 11.75-16.15 17.38q-3.9 3.8-2.06 8.33c3.43 8.42 13.76 18.77 20.58 25.69q3.73 3.79 13.85 12.62 13.01 11.36 24.66 24.15c3.89 4.28 6.79 9.55 10.93 13.26q6.13 5.5 13.86 8.58c6.73 2.67 7.8-5.87 9.59-9.78a1.02 1.01-83.9 0 1 .7-.57q3.06-.64 5.07-2.58c6.42-6.16 13.76-11.2 17.75-18.03 4.28-7.35 11.45-12.99 18.65-17.33 4.53-2.73 7.73-7.92 10.83-12.1 4.38-5.94 8.03-9.15 14.22-12.1 6.14-2.91 9.59-7.96 11.2-14.53a1.14 1.12 34.9 0 0-.17-.91c-6.12-8.61-10.81-14.49-17.86-19.57q-3.12-2.25-5.87-4.98-8.65-8.58-18.18-16.19c-5.84-4.67-8.7-8.55-11.13-15.12a1.46 1.39-86.2 0 0-.6-.72q-2.39-1.41-4.65-3.01c-3.63-2.56-6.47-6.93-9.01-9.44q-5.94-5.89-8.77-10.82a.52.51-30.1 0 1 .19-.7c4.22-2.47 9.14-4.25 12.73-7.63s7.87-5.92 10.96-9.79q18.26-22.93 40.62-41.89 5.59-4.74 9.8-10.7a.76.76 0 0 0-.02-.9c-3.92-5.06-8.24-8.75-12.72-13.19-5.45-5.41-10.3-11.66-15.31-17.58-3.03-3.58-6.26-4.87-10.7-4.78-6.29.15-7.83 10.65-4.11 14.32 7.16 7.07 13.67 11.69 19.6 21.24a.63.63 0 0 1-.08.77c-10.05 10.51-21.76 20.85-31.17 30.28q-10.12 10.13-20.32 20.23a.34.34 0 0 1-.56-.11c-3.8-8.81-2.29-15.12-2.3-24.14q-.02-12.59-1.08-25.16-.72-8.38 4.19-15.8c4.62-6.99 13.56-17.28 13.84-23.66.14-3.14-1.94-8.43-5.94-5.22-1.94 1.56-14.05 13.22-15.46 4.93a.44.44 0 0 1 .51-.5";
const BRAND_MARK_LOWER_PATH =
  "M62.19 252.31q7.75 6.07 18.02 8.01a.44.43-83.8 0 0 .51-.42c.22-6.9.57-14.68-1.39-21.37-2.07-7.09-2.12-12.55.85-20.21 1.39-3.57-.77-9.61-1.68-13.2-1.6-6.38-.18-13.19 1.56-19.36.32-1.17.28-3.12.01-4.08q-3.2-11.48-2.12-23.38.05-.5-.33-.18-16.24 13.73-31.23 28.81c-4.4 4.43-10 7.26-14.09 11.71q-5 5.44-6.65 9.3-1.49 3.5 1.38 7.06c6.58 8.13 13.3 18.31 19.65 21.63 7.27 3.81 9.58 11.05 15.51 15.68m85.52-47.38c-8.85-5.27-15.02-11.22-23.16-19.26-7.29-7.22-17.38-15.73-25.02-25.78q-1.38-1.81-2.4.22-3.05 6.05-.76 13.92c.75 2.57-1.78 7.86-2.06 10.89-.45 4.81 1.79 10.23 2.34 15.09q1.57 13.9-.5 28.79c-.99 7.12-.74 11.57 1.45 17.8 1.7 4.82-.25 12.24-1.43 17.16q-.12.49.27.18 6.99-5.56 14-11.13c5.71-4.53 9.37-9.33 13.33-15.11 4.18-6.11 8.34-7.97 15.91-11.78 1.93-.97 3.07-1.81 3.57-4.11q1.84-8.43 4.65-16.37a.43.42 25.2 0 0-.19-.51";
const INTENSITY_LABEL = "Intensit\u00e9";

function resolveTimeIntensity(): number {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) return 1;
  if (hour >= 18 || hour < 9) return 0.72;
  return 0.48;
}

export function BrandBadge({ visual }: { visual: BrandVisualState }) {
  const timeIntensity = useMemo(resolveTimeIntensity, []);
  const resolvedIntensity = Math.max(0.25, Math.min(1, visual.intensity * 0.35 + timeIntensity * 0.65));
  const brandIntensity = useSharedValue(resolvedIntensity);
  const pulse = useSharedValue(0);
  const bleeding = visual.state === "bleeding";

  useEffect(() => {
    brandIntensity.value = withTiming(resolvedIntensity, { duration: 320 });
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: Math.max(520, 1800 - resolvedIntensity * 1100),
      }),
      -1,
      true,
    );
  }, [brandIntensity, pulse, resolvedIntensity]);

  const animatedMarkProps = useAnimatedProps(() => {
    const lowColor = interpolateColor(brandIntensity.value, [0, 1], ["#2A2930", "#7A0000"]);
    const highColor = interpolateColor(brandIntensity.value, [0, 1], ["#5E1A1F", "#FF1A1A"]);
    const stroke = interpolateColor(pulse.value, [0, 1], [lowColor, highColor]);

    return { stroke };
  });

  const markWrapStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.72, 0.96]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1 + brandIntensity.value * 0.055]) }],
  }));

  const intensityLabel = `${Math.round(resolvedIntensity * 100)}%`;

  return (
    <View style={[styles.badge, bleeding && styles.bleeding]}>
      <View style={styles.header}>
        <Animated.View style={[styles.markWrap, markWrapStyle]}>
          <Svg width={48} height={82} viewBox="0 0 176 300">
            <AnimatedPath
              animatedProps={animatedMarkProps}
              d={BRAND_MARK_MAIN_PATH}
              fill="none"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <AnimatedPath
              animatedProps={animatedMarkProps}
              d={BRAND_MARK_LOWER_PATH}
              fill="none"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
        <View style={styles.copy}>
          <Text style={styles.title}>Marque du Sacrifice</Text>
          <Text style={styles.meta}>
            {INTENSITY_LABEL}: {intensityLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.bg.secondary,
    borderColor: theme.colors.metal,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  bleeding: {
    borderColor: theme.colors.blood.glow,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  markWrap: {
    width: 58,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF0000",
    shadowOpacity: 0.55,
    shadowRadius: 16,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
  },
  meta: { color: theme.colors.text.muted, marginTop: theme.spacing.xs },
});
