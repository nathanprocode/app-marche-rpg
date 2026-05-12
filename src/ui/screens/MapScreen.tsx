import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../../features/mapJourney/interpolation";
import { usePlayerStore } from "../../store/usePlayerStore";
import { theme } from "../../core/theme";
import { GutsMarker } from "../components/GutsMarker";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";

const worldMapAsset = require("../../../assets/map/world-map.png");
const checkpointMarkerAsset = require("../../../assets/images/icon_marker.png");
const finalCheckpointAsset = require("../../../assets/images/icon_final.png");
const MAP_WIDTH = 1448;
const MAP_HEIGHT = 1086;
const MIN_ZOOM = 0.65;
const BASE_ZOOM = 1;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.18;
const NEXT_STEP_PROGRESS_LABEL = "Progression jusqu'\u00e0 la prochaine \u00e9tape";
const NEXT_STEP_TITLE = "Prochaine \u00e9tape";
const JOURNEY_COMPLETE_TITLE = "P\u00e9riple accompli";
const JOURNEY_COMPLETE_DESCRIPTION = "Tu as atteint le dernier souvenir de la Traque.";

type MapOffset = {
  x: number;
  y: number;
};

export function MapScreen() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(BASE_ZOOM);
  const [mapOffset, setMapOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const mapOffsetRef = useRef<MapOffset>({ x: 0, y: 0 });
  const dragStartRef = useRef<MapOffset>({ x: 0, y: 0 });
  const progress = usePlayerStore((state) => state.progress);
  const position = calculateGutsPosition(progress.totalDistanceKm, BERSERK_CHECKPOINTS);
  const isJourneyComplete = position.previous.id === position.next.id;
  const remainingKm = Math.max(0, position.next.kmThreshold - progress.totalDistanceKm);
  const contentWidth = MAP_WIDTH * zoom;
  const contentHeight = MAP_HEIGHT * zoom;

  function clampOffset(nextOffset: MapOffset, zoomValue = zoom): MapOffset {
    const scaledWidth = MAP_WIDTH * zoomValue;
    const scaledHeight = MAP_HEIGHT * zoomValue;

    const x =
      scaledWidth <= viewport.width
        ? (viewport.width - scaledWidth) / 2
        : Math.max(viewport.width - scaledWidth, Math.min(0, nextOffset.x));
    const y =
      scaledHeight <= viewport.height
        ? (viewport.height - scaledHeight) / 2
        : Math.max(viewport.height - scaledHeight, Math.min(0, nextOffset.y));

    return { x, y };
  }

  function updateMapOffset(nextOffset: MapOffset, zoomValue = zoom): void {
    const clampedOffset = clampOffset(nextOffset, zoomValue);
    mapOffsetRef.current = clampedOffset;
    setMapOffset(clampedOffset);
  }

  function getGutsCenteredOffset(zoomValue = zoom): MapOffset {
    const markerX = (position.x / 100) * MAP_WIDTH * zoomValue;
    const markerY = (position.y / 100) * MAP_HEIGHT * zoomValue;

    return clampOffset(
      {
        x: viewport.width / 2 - markerX,
        y: viewport.height / 2 - markerY,
      },
      zoomValue,
    );
  }

  function recenterOnGuts(zoomValue = zoom): void {
    updateMapOffset(getGutsCenteredOffset(zoomValue), zoomValue);
  }

  function handleZoom(nextZoom: number): void {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoom(clampedZoom);
    recenterOnGuts(clampedZoom);
  }

  const mapPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          dragStartRef.current = mapOffsetRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          updateMapOffset(
            {
              x: dragStartRef.current.x + gesture.dx,
              y: dragStartRef.current.y + gesture.dy,
            },
            zoom,
          );
        },
      }),
    [viewport.height, viewport.width, zoom],
  );

  useEffect(() => {
    if (!viewport.width || !viewport.height) {
      return;
    }

    recenterOnGuts();
  }, [position.x, position.y, viewport.height, viewport.width]);

  function handleMapViewportLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <SteelCard>
          <Text style={styles.title}>Carte de la Traque</Text>
          <Text style={styles.meta}>Distance totale parcourue : {progress.totalDistanceKm.toFixed(2)} km</Text>
          <Text style={styles.meta}>
            {NEXT_STEP_PROGRESS_LABEL} : {position.segmentProgressPct.toFixed(1)}%
          </Text>
        </SteelCard>

        <View style={styles.mapViewport} onLayout={handleMapViewportLayout}>
          <View
            {...mapPanResponder.panHandlers}
            style={[
              styles.mapContent,
              {
                width: contentWidth,
                height: contentHeight,
                transform: [{ translateX: mapOffset.x }, { translateY: mapOffset.y }],
              },
            ]}
          >
            <ImageBackground
              source={worldMapAsset}
              style={[styles.mapBackground, { width: contentWidth, height: contentHeight }]}
              imageStyle={styles.mapImage}
            >
              {BERSERK_CHECKPOINTS.map((checkpoint, index) => {
                const isReached = checkpoint.kmThreshold <= progress.totalDistanceKm + 0.0001;
                const isFinalCheckpoint = index === BERSERK_CHECKPOINTS.length - 1;

                return (
                  <View
                    key={checkpoint.id}
                    style={[
                      styles.checkpointMarker,
                      isReached && styles.checkpointMarkerReached,
                      { left: `${checkpoint.x}%`, top: `${checkpoint.y}%` },
                    ]}
                  >
                    <Image
                      source={isFinalCheckpoint ? finalCheckpointAsset : checkpointMarkerAsset}
                      style={[styles.checkpointIcon, isFinalCheckpoint && styles.finalCheckpointIcon]}
                      resizeMode="contain"
                    />
                  </View>
                );
              })}
              <GutsMarker xPct={position.x} yPct={position.y} />
            </ImageBackground>
          </View>

          <View style={styles.mapControls}>
            <Pressable style={styles.mapControlButton} onPress={() => handleZoom(zoom + ZOOM_STEP)}>
              <Ionicons name="add" size={20} color={theme.colors.text.primary} />
            </Pressable>
            <Pressable style={styles.mapControlButton} onPress={() => handleZoom(zoom - ZOOM_STEP)}>
              <Ionicons name="remove" size={20} color={theme.colors.text.primary} />
            </Pressable>
            <Pressable style={styles.mapControlButton} onPress={() => handleZoom(BASE_ZOOM)}>
              <Ionicons name="locate" size={20} color={theme.colors.blood.glow} />
            </Pressable>
          </View>
        </View>

        <SteelCard>
          <Text style={styles.nextEyebrow}>{NEXT_STEP_TITLE}</Text>
          <Text style={styles.cpTitle}>{isJourneyComplete ? JOURNEY_COMPLETE_TITLE : position.next.title}</Text>
          <Text style={styles.meta}>
            {isJourneyComplete
              ? JOURNEY_COMPLETE_DESCRIPTION
              : `${remainingKm.toFixed(2)} km avant le prochain souvenir`}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${position.segmentProgressPct}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            {NEXT_STEP_PROGRESS_LABEL} : {position.segmentProgressPct.toFixed(1)}%
          </Text>
        </SteelCard>

        <View style={styles.currentCheckpointCard}>
          <SteelCard>
            <Text style={styles.arc}>{position.previous.arc}</Text>
            <Text style={styles.cpTitle}>{position.previous.title}</Text>
            <Text style={styles.cpDesc}>{position.previous.description}</Text>
          </SteelCard>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
  },
  meta: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  mapViewport: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    height: 390,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    overflow: "hidden",
  },
  mapContent: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  mapBackground: {
    backgroundColor: "#101014",
  },
  mapImage: {
    resizeMode: "stretch",
    opacity: 0.92,
  },
  mapControls: {
    position: "absolute",
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  mapControlButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(10,10,12,0.82)",
  },
  checkpointMarker: {
    position: "absolute",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  checkpointMarkerReached: {
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  checkpointIcon: {
    width: 30,
    height: 30,
  },
  finalCheckpointIcon: {
    width: 40,
    height: 40,
  },
  nextEyebrow: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.extraBold,
    marginBottom: theme.spacing.xs,
  },
  progressTrack: {
    height: 16,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.sm,
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
    borderRadius: theme.radius.sm,
    backgroundColor: "#8B0000",
  },
  progressCaption: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.sm,
  },
  currentCheckpointCard: {
    marginTop: theme.spacing.lg,
  },
  arc: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
    marginBottom: theme.spacing.xs,
  },
  cpTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.extraBold,
  },
  cpDesc: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.sm,
  },
});
