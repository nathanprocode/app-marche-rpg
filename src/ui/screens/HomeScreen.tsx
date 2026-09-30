import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GAME_CONFIG } from "../../core/constants/game";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../../features/mapJourney/interpolation";
import { Screen } from "../components/Screen";
import { theme } from "../../core/theme";
import type { DailyDistanceEntry } from "../../store/usePedometerStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

const bootIconAsset = require("../../../assets/images/icon_boot.png");
const gutsMarkerAsset = require("../../../assets/map/guts-marker.png");
const campForestDayAsset = require("../../../assets/images/camp_forest_day.png");
const campForestNightAsset = require("../../../assets/images/camp_forest_night.png");

function isNightHour(hour: number): boolean {
  return hour >= 20 || hour < 6;
}

function resolveCampLine(hour: number, checkpointTitle: string): string {
  if (hour >= 20 || hour < 6) {
    return `La nuit serre les dents. Depuis ${checkpointTitle}, chaque pas garde les ombres a distance.`;
  }

  if (hour < 12) {
    return `Le camp s'eveille. Depuis ${checkpointTitle}, la route attend ton premier effort.`;
  }

  return `La braise tient bon. Depuis ${checkpointTitle}, continue d'user la route sous tes bottes.`;
}

function formatDayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);

  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }).replace(".", "");
}

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function resolveDailyRank(distanceKm: number): string {
  if (distanceKm >= GAME_CONFIG.dailyGoalKm * 1.5) {
    return "Marche de guerre";
  }

  if (distanceKm >= GAME_CONFIG.dailyGoalKm) {
    return "Objectif brisé";
  }

  if (distanceKm >= GAME_CONFIG.dailyGoalKm * 0.45) {
    return "Cadence tenue";
  }

  if (distanceKm > 0) {
    return "Première braise";
  }

  return "Feu en veille";
}

function buildDailyObjectiveLine(distanceKm: number, nextTitle: string): string {
  if (distanceKm >= GAME_CONFIG.dailyGoalKm) {
    return `La journée est gagnée. La route vers ${nextTitle} a reculé sous tes pas.`;
  }

  if (distanceKm > 0) {
    return `Encore quelques kilometres avant le repos. ${nextTitle} t'attend au loin.`;
  }

  return `Le feu crépite encore. Premier pas vers ${nextTitle}, puis la traque reprend.`;
}

function buildJournalLine(entry: DailyDistanceEntry, checkpointTitle: string): string {
  if (entry.distanceKm >= GAME_CONFIG.dailyGoalKm * 1.5) {
    return `${entry.distanceKm.toFixed(2)} km arrachés à la route depuis ${checkpointTitle}.`;
  }

  if (entry.distanceKm >= GAME_CONFIG.dailyGoalKm) {
    return `${entry.distanceKm.toFixed(2)} km parcourus, assez pour faire taire les ombres.`;
  }

  if (entry.distanceKm > 0) {
    return `${entry.distanceKm.toFixed(2)} km de reconnaissance. Le chemin reste ouvert.`;
  }

  return "Aucune trace fraîche dans la boue. Le feu a veillé seul.";
}

function buildJournalEntries(dailyHistory: DailyDistanceEntry[], stepsToday: number, checkpointTitle: string) {
  const todayKey = getLocalDayKey();
  const todayDistanceKm = stepsToday * GAME_CONFIG.metersPerStep / 1000;
  const mergedHistory = [
    ...dailyHistory.filter((entry) => entry.dayKey !== todayKey),
    {
      dayKey: todayKey,
      steps: stepsToday,
      distanceKm: todayDistanceKm,
      updatedAtISO: new Date().toISOString(),
    },
  ].sort((a, b) => b.dayKey.localeCompare(a.dayKey));

  return mergedHistory.slice(0, 3).map((entry) => ({
    dayKey: entry.dayKey,
    label: entry.dayKey === todayKey ? "Aujourd'hui" : formatDayLabel(entry.dayKey),
    distanceKm: entry.distanceKm,
    rank: resolveDailyRank(entry.distanceKm),
    line: buildJournalLine(entry, checkpointTitle),
  }));
}

function CampGutsSprite({ isNight }: { isNight: boolean }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const scale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] });

  return (
    <View style={styles.campScene}>
      <Image
        source={isNight ? campForestNightAsset : campForestDayAsset}
        style={styles.campSceneImage}
        resizeMode="stretch"
      />
      <View style={[styles.campVeil, isNight && styles.campVeilNight]} />
      <Animated.Image
        source={gutsMarkerAsset}
        resizeMode="contain"
        style={[styles.gutsSprite, { transform: [{ translateX: 34 }, { translateY }, { scale }, { rotate }] }]}
      />
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const steps = usePedometerStore((state) => state.stepsToday);
  const distance = usePedometerStore((state) => state.distanceTodayKm);
  const dailyHistory = usePedometerStore((state) => state.dailyHistory);
  const progress = usePlayerStore((state) => state.progress.progressPct);
  const totalSteps = usePlayerStore((state) => state.progress.totalSteps);
  const totalKm = usePlayerStore((state) => state.progress.totalDistanceKm);
  const stepPulse = useRef(new Animated.Value(1)).current;
  const previousStepsRef = useRef<number | null>(null);
  const position = useMemo(() => calculateGutsPosition(totalKm, BERSERK_CHECKPOINTS), [totalKm]);
  const remainingKm = Math.max(0, position.next.kmThreshold - totalKm);
  const currentHour = new Date().getHours();
  const campLine = resolveCampLine(currentHour, position.previous.title);
  const dailyObjectivePct = Math.min(100, (distance / GAME_CONFIG.dailyGoalKm) * 100);
  const dailyObjectiveLine = buildDailyObjectiveLine(distance, position.next.title);
  const journalEntries = useMemo(
    () => buildJournalEntries(dailyHistory, steps, position.previous.title),
    [dailyHistory, position.previous.title, steps],
  );

  useEffect(() => {
    if (previousStepsRef.current === null) {
      previousStepsRef.current = steps;
      return;
    }

    if (steps > previousStepsRef.current) {
      Animated.sequence([
        Animated.timing(stepPulse, {
          toValue: 1.08,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepPulse, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousStepsRef.current = steps;
  }, [stepPulse, steps]);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Feu de camp</Text>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Objectif: 1000 km</Text>

        <CampGutsSprite isNight={isNightHour(currentHour)} />

        <Animated.View style={[styles.stepsHero, { transform: [{ scale: stepPulse }] }]}>
          <Image source={bootIconAsset} style={styles.stepsIcon} resizeMode="contain" />
          <View>
            <Text style={styles.stepsLabel}>Pas du jour</Text>
            <Text style={styles.stepsValue}>{steps}</Text>
          </View>
        </Animated.View>

        <Text style={styles.campLine}>{campLine}</Text>
      </View>

      <View style={styles.dailyQuestPanel}>
        <View style={styles.nextHeader}>
          <Text style={styles.panelEyebrow}>Quête du jour</Text>
          <Text style={styles.remainingText}>
            {distance.toFixed(2)} / {GAME_CONFIG.dailyGoalKm.toFixed(0)} km
          </Text>
        </View>
        <Text style={styles.questRank}>{resolveDailyRank(distance)}</Text>
        <View style={styles.dailyBossTrack}>
          <View style={[styles.dailyBossFill, { width: `${dailyObjectivePct}%` }]} />
        </View>
        <Text style={styles.progressCaption}>{dailyObjectiveLine}</Text>
      </View>

      <View style={styles.nextPanel}>
        <View style={styles.nextHeader}>
          <Text style={styles.panelEyebrow}>Prochaine etape</Text>
          <Text style={styles.remainingText}>{remainingKm.toFixed(2)} km</Text>
        </View>
        <Text style={styles.nextTitle}>{position.next.title}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${position.segmentProgressPct}%` }]} />
        </View>
        <Text style={styles.progressCaption}>{position.segmentProgressPct.toFixed(1)}% jusqu'au prochain souvenir</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statPanel, styles.statPanelHalf, styles.statPanelPrimary]}>
          <Text style={styles.statLabel}>Km du jour</Text>
          <Text style={styles.statValuePrimary}>{distance.toFixed(2)}</Text>
        </View>
        <View style={[styles.statPanel, styles.statPanelHalf, styles.statPanelPrimary]}>
          <Text style={styles.statLabel}>Distance totale</Text>
          <Text style={styles.statValuePrimary}>{totalKm.toFixed(3)} km</Text>
        </View>
        <View style={[styles.statPanel, styles.statPanelHalf]}>
          <Text style={styles.statLabel}>Total pas</Text>
          <Text style={styles.statValue}>{totalSteps}</Text>
        </View>
        <View style={[styles.statPanel, styles.statPanelHalf]}>
          <Text style={styles.statLabel}>Progression totale</Text>
          <Text style={styles.statValue}>{progress.toFixed(2)}%</Text>
        </View>
      </View>

      <View style={styles.journalPanel}>
        <Text style={styles.panelEyebrow}>Journal de route</Text>
        <Text style={styles.journalTitle}>Dernières traces</Text>
        {journalEntries.map((entry) => (
          <View key={entry.dayKey} style={styles.journalEntry}>
            <View style={styles.journalEntryHeader}>
              <Text style={styles.journalDay}>{entry.label}</Text>
              <Text style={styles.journalDistance}>{entry.distanceKm.toFixed(2)} km</Text>
            </View>
            <Text style={styles.journalRank}>{entry.rank}</Text>
            <Text style={styles.journalLine}>{entry.line}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.push("/(tabs)/map")}>
        <Text style={styles.buttonText}>Reprendre la Traque</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.sm,
  },
  campScene: {
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
    overflow: "hidden",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.55)",
  },
  campSceneImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.98,
  },
  campVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  campVeilNight: {
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  gutsSprite: {
    width: 166,
    height: 166,
    zIndex: 2,
  },
  stepsHero: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.55)",
    backgroundColor: "rgba(55,5,8,0.34)",
  },
  stepsIcon: {
    width: 42,
    height: 42,
  },
  stepsLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.sm,
  },
  stepsValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 42,
    fontWeight: theme.typography.weight.extraBold,
    lineHeight: 46,
  },
  campLine: {
    color: theme.colors.text.muted,
    lineHeight: 21,
    marginTop: theme.spacing.lg,
  },
  nextPanel: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.5)",
    backgroundColor: "rgba(12,12,15,0.9)",
    padding: theme.spacing.lg,
  },
  dailyQuestPanel: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.58)",
    backgroundColor: "rgba(32,4,7,0.36)",
    padding: theme.spacing.lg,
  },
  questRank: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.sm,
  },
  dailyBossTrack: {
    height: 20,
    marginTop: theme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.45)",
    backgroundColor: "#000000",
    shadowColor: "red",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  dailyBossFill: {
    height: "100%",
    backgroundColor: "#C1121F",
  },
  nextHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  panelEyebrow: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  remainingText: {
    color: theme.colors.text.primary,
    fontWeight: "700",
  },
  nextTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.sm,
  },
  progressTrack: {
    height: 16,
    marginTop: theme.spacing.md,
    overflow: "hidden",
    backgroundColor: "#000000",
    shadowColor: "red",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B0000",
  },
  progressCaption: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  journalPanel: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(12,12,15,0.92)",
    padding: theme.spacing.lg,
  },
  journalTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  journalEntry: {
    borderTopWidth: 1,
    borderTopColor: "rgba(94,100,114,0.45)",
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  journalEntryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  journalDay: {
    color: theme.colors.text.primary,
    fontWeight: "700",
  },
  journalDistance: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
  },
  journalRank: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
    textTransform: "uppercase",
  },
  journalLine: {
    color: theme.colors.text.muted,
    lineHeight: 21,
    marginTop: theme.spacing.xs,
  },
  statPanel: {
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(10,10,12,0.72)",
    padding: theme.spacing.md,
    minHeight: 92,
    justifyContent: "space-between",
  },
  statPanelPrimary: {
    minHeight: 112,
    borderColor: "rgba(193,18,31,0.35)",
  },
  statPanelHalf: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  statLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.sm,
  },
  statValuePrimary: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 30,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 24,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(139,0,0,0.24)",
    padding: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
    textAlign: "center",
  },
});
