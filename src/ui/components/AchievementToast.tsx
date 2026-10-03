import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../core/theme";
import { getAchievement } from "../../features/achievements/achievements";
import { usePlayerStore } from "../../store/usePlayerStore";

const TOAST_DURATION_MS = 4000;

type AchievementToastProps = {
  enabled: boolean;
};

/** Bandeau « Succès débloqué » : un par un, en haut de l'écran, qui disparaît seul. */
export function AchievementToast({ enabled }: AchievementToastProps) {
  const insets = useSafeAreaInsets();
  const newIds = usePlayerStore((state) => state.newAchievementIds);
  const clearNewAchievements = usePlayerStore((state) => state.clearNewAchievements);
  const [queue, setQueue] = useState<string[]>([]);
  const opacity = useRef(new Animated.Value(0)).current;
  const currentId = queue[0];

  // Les nouveaux succès passent du store à la file locale : le store se vide, la file s'égrène.
  useEffect(() => {
    if (!enabled || newIds.length === 0) return;
    setQueue((current) => [...current, ...newIds]);
    clearNewAchievements();
  }, [enabled, newIds, clearNewAchievements]);

  useEffect(() => {
    if (!currentId) return;

    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setQueue((current) => current.slice(1));
      });
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentId, opacity]);

  const achievement = currentId ? getAchievement(currentId) : undefined;
  if (!achievement) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={`Succès débloqué : ${achievement.title}. ${achievement.description}`}
      style={[styles.toast, { top: insets.top + theme.space[8], opacity }]}
    >
      <View style={styles.icon}>
        <Ionicons name={achievement.icon as keyof typeof Ionicons.glyphMap} size={22} color={theme.colors.bone} />
      </View>
      <View style={styles.text}>
        <Text style={styles.kicker}>Succès débloqué</Text>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.small}>{achievement.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: theme.space[16],
    right: theme.space[16],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    padding: theme.space[16],
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: theme.colors.bloodGlow,
    borderRadius: theme.radius[4],
    elevation: 8,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: theme.colors.blood,
    borderWidth: 1,
    borderColor: theme.colors.bloodGlow,
  },
  text: { flex: 1 },
  kicker: { ...theme.text.label, color: theme.colors.bloodEmber },
  title: { ...theme.text.bodyStrong, color: theme.colors.bone },
  small: { ...theme.text.small, color: theme.colors.boneDim },
});
