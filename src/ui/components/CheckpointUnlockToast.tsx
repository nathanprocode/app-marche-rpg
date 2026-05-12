import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { usePlayerStore } from "../../store/usePlayerStore";
import { theme } from "../../core/theme";

type CheckpointUnlockToastProps = {
  enabled: boolean;
};

const UNLOCKED_LABEL = "Souvenir d\u00e9bloqu\u00e9";

export function CheckpointUnlockToast({ enabled }: CheckpointUnlockToastProps) {
  const insets = useSafeAreaInsets();
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);
  const previousIdsRef = useRef<string[] | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const [checkpoint, setCheckpoint] = useState<BerserkCheckpoint | null>(null);

  useEffect(() => {
    const previousIds = previousIdsRef.current;

    if (!enabled || previousIds === null) {
      previousIdsRef.current = unlockedCheckpoints;
      return;
    }

    const newIds = unlockedCheckpoints.filter((id) => !previousIds.includes(id));
    previousIdsRef.current = unlockedCheckpoints;

    if (newIds.length === 0) {
      return;
    }

    const unlockedCheckpoint = BERSERK_CHECKPOINTS.filter((item) => newIds.includes(item.id)).sort(
      (a, b) => b.kmThreshold - a.kmThreshold,
    )[0];

    if (!unlockedCheckpoint) {
      return;
    }

    setCheckpoint(unlockedCheckpoint);
    animation.stopAnimation();
    animation.setValue(0);

    Animated.sequence([
      Animated.spring(animation, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.delay(2600),
      Animated.timing(animation, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setCheckpoint(null);
      }
    });
  }, [animation, enabled, unlockedCheckpoints]);

  if (!checkpoint) {
    return null;
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View pointerEvents="none" style={[styles.overlay, { paddingTop: Math.max(insets.top, 18) + theme.spacing.sm }]}>
      <Animated.View style={[styles.toast, { opacity: animation, transform: [{ translateY }, { scale }] }]}>
        <Text style={styles.eyebrow}>{UNLOCKED_LABEL}</Text>
        <Text style={styles.title}>{checkpoint.title}</Text>
        <Text style={styles.meta}>{checkpoint.arc}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 30,
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  toast: {
    width: "100%",
    maxWidth: 420,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(15,15,18,0.96)",
    padding: theme.spacing.md,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  eyebrow: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
});
