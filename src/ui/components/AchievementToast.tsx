import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../core/theme";
import { getAchievement } from "../../features/achievements/achievements";
import { vibrate } from "../../features/haptics/haptics";
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

    vibrate("achievement");
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
        <Ionicons name={achievement.icon as keyof typeof Ionicons.glyphMap} size={22} color={theme.colors.black} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.small}>{`Succès débloqué · ${achievement.description}`}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Une case noire cadrée de rouge, posée en haut de l'écran.
  toast: {
    position: "absolute",
    left: theme.gutter * 2,
    right: theme.gutter * 2,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    padding: theme.space[16],
    backgroundColor: theme.colors.black,
    borderWidth: theme.frame,
    borderColor: theme.colors.redOnBlack,
    elevation: 8,
  },
  icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.paper },
  text: { flex: 1, gap: 2 },
  title: { ...theme.text.displayS, fontSize: 18, lineHeight: 24, color: theme.colors.paper },
  small: { ...theme.text.small, color: theme.colors.paperSoft },
});
