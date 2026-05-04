import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import checkpoints from "../../data/map/checkpoints.json";
import stages from "../../data/map/stages.json";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useBrandStore } from "../../store/useBrandStore";
import { runDailySync } from "../../features/runtime/dailySync";
import { resolveAvatarPosition } from "../../features/mapJourney/mapEngine";
import { theme } from "../../core/theme";
import { GutsMarker } from "../components/GutsMarker";
import { kmRemaining } from "../../features/progression/selectors";

const worldMapAsset = require("../../../assets/map/world-map.png");

type Checkpoint = { stageId: string; x: number; y: number };
type Stage = { id: string };

function routeSegmentStyle(from: Checkpoint, to: Checkpoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthPct = Math.sqrt(dx * dx + dy * dy) * 100;
  const angle = Math.atan2(dy, dx);

  return {
    left: `${from.x * 100}%`,
    top: `${from.y * 100}%`,
    width: `${lengthPct}%`,
    transform: [{ rotate: `${angle}rad` }],
  } as const;
}

export function MapScreen() {
  const progress = usePlayerStore((state) => state.progress);
  const brandVisual = useBrandStore((state) => state.status.visual);
  const avatar = resolveAvatarPosition(progress.currentStageId, progress.currentStageProgressPct);
  const points = checkpoints as Checkpoint[];
  const stageList = stages as Stage[];

  const bloodPulse = useRef(new Animated.Value(0.2)).current;
  const fogPulse = useRef(new Animated.Value(0.08)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  const currentStageIndex = stageList.findIndex((stage) => stage.id === progress.currentStageId);
  const segmentPairs = useMemo(() => points.slice(0, -1).map((from, i) => [from, points[i + 1]] as const), [points]);

  useEffect(() => {
    const fogLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fogPulse, {
          toValue: 0.16,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fogPulse, {
          toValue: 0.08,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    fogLoop.start();
    return () => fogLoop.stop();
  }, [fogPulse]);

  useEffect(() => {
    if (brandVisual.state !== "bleeding") return;

    const bloodLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bloodPulse, {
          toValue: 0.42,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bloodPulse, {
          toValue: 0.2,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -2, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 2, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 65, useNativeDriver: true }),
      ]),
    );

    bloodLoop.start();
    shakeLoop.start();

    return () => {
      bloodLoop.stop();
      shakeLoop.stop();
      shakeX.setValue(0);
    };
  }, [bloodPulse, brandVisual.state, shakeX]);

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Carte de la Traque</Text>
        <Text style={styles.meta}>Étape: {progress.currentStageId}</Text>
        <Text style={styles.meta}>Progression étape: {progress.currentStageProgressPct.toFixed(1)}%</Text>
        <Text style={styles.meta}>Km restants: {kmRemaining(progress).toFixed(1)}</Text>
        <Pressable style={styles.syncBtn} onPress={() => void runDailySync()}>
          <Text style={styles.syncBtnText}>Forcer une synchro</Text>
        </Pressable>
      </SteelCard>

      <Animated.View style={[styles.mapContainer, { transform: [{ translateX: shakeX }] }]}>
        <ImageBackground source={worldMapAsset} style={styles.mapBackground} imageStyle={styles.mapImage}>
          {segmentPairs.map(([from, to], index) => {
            const done = index < currentStageIndex;
            const current = index === currentStageIndex;

            return (
              <View
                key={`${from.stageId}-${to.stageId}`}
                style={[
                  styles.segment,
                  routeSegmentStyle(from, to),
                  done && styles.segmentDone,
                  current && styles.segmentCurrent,
                ]}
              />
            );
          })}

          {points.map((point) => {
            const index = stageList.findIndex((stage) => stage.id === point.stageId);
            const isCurrent = point.stageId === progress.currentStageId;
            const isDone = index < currentStageIndex;

            return (
              <View
                key={point.stageId}
                style={[
                  styles.checkpoint,
                  {
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                  },
                  isDone && styles.checkpointDone,
                  isCurrent && styles.checkpointCurrent,
                ]}
              />
            );
          })}

          <GutsMarker xPct={avatar.x} yPct={avatar.y} />

          <Animated.View pointerEvents="none" style={[styles.fogOverlay, { opacity: fogPulse }]} />
          {brandVisual.state === "bleeding" ? (
            <Animated.View pointerEvents="none" style={[styles.bleedOverlay, { opacity: bloodPulse }]} />
          ) : null}
        </ImageBackground>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.lg },
  meta: { color: theme.colors.text.muted, marginTop: theme.spacing.xs },
  syncBtn: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  syncBtnText: {
    color: theme.colors.text.primary,
    textAlign: "center",
    fontSize: theme.typography.size.sm,
  },
  mapContainer: {
    marginTop: theme.spacing.lg,
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    overflow: "hidden",
  },
  mapBackground: {
    flex: 1,
    backgroundColor: "#101014",
  },
  mapImage: {
    resizeMode: "cover",
    opacity: 0.92,
  },
  segment: {
    position: "absolute",
    height: 4,
    marginTop: -2,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
  },
  segmentDone: {
    backgroundColor: "rgba(193,18,31,0.95)",
  },
  segmentCurrent: {
    backgroundColor: "rgba(193,18,31,0.6)",
  },
  checkpoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: theme.colors.bg.primary,
  },
  checkpointDone: {
    backgroundColor: "rgba(138,3,3,0.95)",
  },
  checkpointCurrent: {
    backgroundColor: theme.colors.blood.glow,
    transform: [{ scale: 1.2 }],
    borderColor: theme.colors.text.primary,
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(185,185,185,0.18)",
  },
  bleedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(120,0,0,0.55)",
  },
});
