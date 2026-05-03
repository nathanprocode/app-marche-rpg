import { ImageBackground, StyleSheet, Text, View } from "react-native";
import checkpoints from "../../data/map/checkpoints.json";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { usePlayerStore } from "../../store/usePlayerStore";
import { resolveAvatarPosition } from "../../features/mapJourney/mapEngine";
import { theme } from "../../core/theme";
import { GutsMarker } from "../components/GutsMarker";
import { kmRemaining } from "../../features/progression/selectors";

const worldMapAsset = require("../../../assets/map/world-map.png");

type Checkpoint = { stageId: string; x: number; y: number };

export function MapScreen() {
  const progress = usePlayerStore((state) => state.progress);
  const avatar = resolveAvatarPosition(progress.currentStageId, progress.currentStageProgressPct);
  const points = checkpoints as Checkpoint[];

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Carte de la Traque</Text>
        <Text style={styles.meta}>Étape: {progress.currentStageId}</Text>
        <Text style={styles.meta}>Progression étape: {progress.currentStageProgressPct.toFixed(1)}%</Text>
        <Text style={styles.meta}>Km restants: {kmRemaining(progress).toFixed(1)}</Text>
      </SteelCard>

      <View style={styles.mapContainer}>
        <ImageBackground source={worldMapAsset} style={styles.mapBackground} imageStyle={styles.mapImage}>
          {points.map((point) => {
            const isCurrent = point.stageId === progress.currentStageId;
            return (
              <View
                key={point.stageId}
                style={[
                  styles.checkpoint,
                  {
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                  },
                  isCurrent && styles.checkpointCurrent,
                ]}
              />
            );
          })}

          <GutsMarker xPct={avatar.x} yPct={avatar.y} />
        </ImageBackground>
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
  checkpointCurrent: {
    backgroundColor: theme.colors.blood.glow,
    transform: [{ scale: 1.2 }],
    borderColor: theme.colors.text.primary,
  },
});
