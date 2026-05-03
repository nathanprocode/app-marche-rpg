import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { usePlayerStore } from "../../store/usePlayerStore";
import { resolveAvatarPosition } from "../../features/mapJourney/mapEngine";
import { theme } from "../../core/theme";
import { GutsMarker } from "../components/GutsMarker";

export function MapScreen() {
  const progress = usePlayerStore((state) => state.progress);
  const avatar = resolveAvatarPosition(progress.currentStageId, progress.currentStageProgressPct);

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Carte de la Traque</Text>
        <Text style={styles.meta}>Étape: {progress.currentStageId}</Text>
        <Text style={styles.meta}>Progression étape: {progress.currentStageProgressPct.toFixed(1)}%</Text>
      </SteelCard>

      <View style={styles.mapContainer}>
        <GutsMarker xPct={avatar.x} yPct={avatar.y} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.lg },
  meta: { color: theme.colors.text.muted, marginTop: theme.spacing.xs },
  mapContainer: {
    marginTop: theme.spacing.lg,
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "#101014",
    overflow: "hidden",
  },
});
