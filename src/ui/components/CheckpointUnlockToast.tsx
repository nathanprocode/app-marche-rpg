import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
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
    ]).start();
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
    outputRange: [0.94, 1],
  });
  const panelImage = BERSERK_PANEL_IMAGES[checkpoint.id];

  function dismiss(): void {
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setCheckpoint(null);
      }
    });
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={dismiss} />
      <Animated.View
        style={[
          styles.victoryCard,
          {
            marginTop: Math.max(insets.top, 18) + theme.spacing.lg,
            opacity: animation,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{UNLOCKED_LABEL}</Text>
          <Text style={styles.arc}>{checkpoint.arc}</Text>
        </View>

        {panelImage ? (
          <Image source={panelImage} style={styles.panelImage} resizeMode="cover" />
        ) : (
          <View style={styles.panelFallback} />
        )}

        <Text style={styles.title}>{checkpoint.title}</Text>
        <Text style={styles.description}>{checkpoint.description}</Text>
        <Text style={styles.meta}>{checkpoint.kmThreshold.toFixed(0)} km atteints</Text>

        <Pressable style={styles.button} onPress={dismiss}>
          <Text style={styles.buttonText}>Continuer la Traque</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  victoryCard: {
    width: "91%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(15,15,18,0.98)",
    padding: theme.spacing.lg,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  arc: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    textTransform: "uppercase",
  },
  panelImage: {
    width: "100%",
    height: 220,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.55)",
  },
  panelFallback: {
    height: 160,
    marginTop: theme.spacing.md,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.55)",
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.md,
  },
  description: {
    color: theme.colors.text.muted,
    lineHeight: 21,
    marginTop: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.md,
    textTransform: "uppercase",
  },
  button: {
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(139,0,0,0.26)",
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
    textAlign: "center",
  },
});
