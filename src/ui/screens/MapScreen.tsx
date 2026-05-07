import { ImageBackground, ScrollView, StyleSheet, Text, View } from "react-native";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../../features/mapJourney/interpolation";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { usePlayerStore } from "../../store/usePlayerStore";
import { theme } from "../../core/theme";
import { GutsMarker } from "../components/GutsMarker";

const worldMapAsset = require("../../../assets/map/world-map.png");
const MAP_WIDTH = 1448;
const MAP_HEIGHT = 1086;

export function MapScreen() {
  const progress = usePlayerStore((state) => state.progress);
  const position = calculateGutsPosition(progress.totalDistanceKm, BERSERK_CHECKPOINTS);

  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Carte de la Traque</Text>
        <Text style={styles.meta}>Km total: {progress.totalDistanceKm.toFixed(2)}</Text>
        <Text style={styles.meta}>Progression segment: {position.segmentProgressPct.toFixed(1)}%</Text>
      </SteelCard>

      <View style={styles.mapViewport}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <ImageBackground source={worldMapAsset} style={styles.mapBackground} imageStyle={styles.mapImage}>
              {BERSERK_CHECKPOINTS.map((checkpoint, index) => {
                const isReached = checkpoint.kmThreshold <= progress.totalDistanceKm + 0.0001;

                return (
                  <View
                    key={checkpoint.id}
                    style={[
                      styles.checkpointMarker,
                      isReached && styles.checkpointMarkerReached,
                      { left: `${checkpoint.x}%`, top: `${checkpoint.y}%` },
                    ]}
                  >
                    <Text style={styles.checkpointMarkerText}>{index + 1}</Text>
                  </View>
                );
              })}
              <GutsMarker xPct={position.x} yPct={position.y} />
            </ImageBackground>
          </ScrollView>
        </ScrollView>
      </View>

      <SteelCard>
        <Text style={styles.arc}>{position.previous.arc}</Text>
        <Text style={styles.cpTitle}>{position.previous.title}</Text>
        <Text style={styles.cpDesc}>{position.previous.description}</Text>
      </SteelCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.lg },
  meta: { color: theme.colors.text.muted, marginTop: theme.spacing.xs },
  mapViewport: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flex: 1,
    minHeight: 360,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    overflow: "hidden",
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: "#101014",
  },
  mapImage: {
    resizeMode: "stretch",
    opacity: 0.92,
  },
  checkpointMarker: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(10,10,12,0.78)",
  },
  checkpointMarkerReached: {
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(138,3,3,0.82)",
  },
  checkpointMarkerText: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  arc: {
    color: theme.colors.blood.glow,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  cpTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    fontWeight: "700",
  },
  cpDesc: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.sm,
  },
});
