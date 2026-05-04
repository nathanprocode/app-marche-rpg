import { Text, StyleSheet, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { theme } from "../../core/theme";
import { runDailySync } from "../../features/runtime/dailySync";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

export function HomeScreen() {
  const router = useRouter();
  const steps = usePedometerStore((state) => state.stepsToday);
  const distance = usePedometerStore((state) => state.distanceTodayKm);
  const progress = usePlayerStore((state) => state.progress.progressPct);

  async function handleSyncDay(): Promise<void> {
    await runDailySync();
    router.push("/map");
  }

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Objectif: 1000 km</Text>
        <Text style={styles.subtitle}>Pas du jour: {steps}</Text>
        <Text style={styles.subtitle}>Km du jour: {distance.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Progression totale: {progress.toFixed(2)}%</Text>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => void handleSyncDay()}>
            <Text style={styles.buttonText}>Synchroniser la journée</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push("/map")}>
            <Text style={styles.buttonText}>Voir la carte</Text>
          </Pressable>
        </View>
      </SteelCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xl },
  subtitle: { color: theme.colors.text.muted, marginTop: theme.spacing.sm },
  actions: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  button: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    padding: theme.spacing.md,
  },
  secondaryButton: {
    borderColor: theme.colors.metal,
  },
  buttonText: { color: theme.colors.text.primary, textAlign: "center" },
});
