import { Image, Text, StyleSheet, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { runDailySync } from "../../features/runtime/dailySync";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

const bootIconAsset = require("../../../assets/images/icon_boot.png");

export function HomeScreen() {
  const router = useRouter();
  const steps = usePedometerStore((state) => state.stepsToday);
  const distance = usePedometerStore((state) => state.distanceTodayKm);
  const resetStepsToday = usePedometerStore((state) => state.resetStepsToday);
  const progress = usePlayerStore((state) => state.progress.progressPct);
  const totalSteps = usePlayerStore((state) => state.progress.totalSteps);
  const totalKm = usePlayerStore((state) => state.progress.totalDistanceKm);
  const advanceToNextCheckpointDev = usePlayerStore((state) => state.advanceToNextCheckpointDev);
  const resetProgressionDev = usePlayerStore((state) => state.resetProgressionDev);
  const nextCheckpoint = BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.kmThreshold > totalKm + 0.0001);

  async function handleSyncDay(): Promise<void> {
    await runDailySync();
    router.push("/(tabs)/map");
  }

  async function handleResetProgressionDev(): Promise<void> {
    await resetProgressionDev();
    await resetStepsToday();
  }

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Objectif: 1000 km</Text>
        <View style={styles.stepsRow}>
          <Image source={bootIconAsset} style={styles.stepsIcon} resizeMode="contain" />
          <Text style={styles.stepsText}>Pas du jour: {steps}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statLabel}>Km du jour</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statLabel}>Total pas</Text>
            <Text style={styles.statValue}>{totalSteps}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>Progression totale</Text>
            <Text style={styles.statValue}>{progress.toFixed(2)}%</Text>
          </View>
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statLabel}>Distance totale</Text>
            <Text style={styles.statValue}>{totalKm.toFixed(3)} km</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => void handleSyncDay()}>
            <Text style={styles.buttonText}>Synchroniser la journée</Text>
          </Pressable>

          <Pressable
            disabled={!nextCheckpoint}
            style={[styles.devButton, !nextCheckpoint && styles.disabledButton]}
            onPress={() => void advanceToNextCheckpointDev()}
          >
            <Text style={styles.buttonText}>
              {nextCheckpoint ? `Checkpoint suivant: ${nextCheckpoint.title}` : "Parcours terminé"}
            </Text>
          </Pressable>

          <Pressable style={styles.devButton} onPress={() => void handleResetProgressionDev()}>
            <Text style={styles.buttonText}>Reset Progression (Dev)</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push("/(tabs)/map")}>
            <Text style={styles.buttonText}>Voir la carte</Text>
          </Pressable>
        </View>
      </SteelCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.extraBold,
  },
  subtitle: { color: theme.colors.text.muted, marginTop: theme.spacing.sm },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  stepsIcon: {
    width: 30,
    height: 30,
  },
  stepsText: {
    color: theme.colors.text.primary,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  statCard: {
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(10,10,12,0.55)",
    padding: theme.spacing.md,
    minHeight: 96,
    justifyContent: "space-between",
  },
  statCardHalf: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  statCardFull: {
    flexBasis: "100%",
  },
  statLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.sm,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 30,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.sm,
  },
  actions: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  button: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    padding: theme.spacing.md,
  },
  devButton: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blood.base,
    backgroundColor: "rgba(138,3,3,0.2)",
    padding: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.55,
  },
  secondaryButton: {
    borderColor: theme.colors.metal,
  },
  buttonText: { color: theme.colors.text.primary, textAlign: "center", fontWeight: "700" },
});
