import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
const companionCascaAsset = require("../../../assets/images/companion_casca.png");
const companionGriffithAsset = require("../../../assets/images/companion_griffith.png");
const companionSkullknightAsset = require("../../../assets/images/companion_skullknight.png");
const companionIsidroAsset = require("../../../assets/images/companion_isidro.png");
const companionFarneseAsset = require("../../../assets/images/companion_farnese.png");
const companionSerpicoAsset = require("../../../assets/images/companion_serpico.png");
const companionSchierkeAsset = require("../../../assets/images/companion_schierke.png");
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

type ActiveCompanion = {
  id: string;
  asset: number;
  offsetX: number;
  offsetY: number;
  delay: number;
  startCheckpointId: string;
  endCheckpointId?: string;
};

type MapOffset = {
  x: number;
  y: number;
};

function RouteSegment({
  from,
  to,
  contentWidth,
  contentHeight,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  contentWidth: number;
  contentHeight: number;
}) {
  const fromX = (from.x / 100) * contentWidth;
  const fromY = (from.y / 100) * contentHeight;
  const toX = (to.x / 100) * contentWidth;
  const toY = (to.y / 100) * contentHeight;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = `${Math.atan2(dy, dx)}rad`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.routeSegment,
        {
          left: fromX + dx / 2 - length / 2,
          top: fromY + dy / 2 - 2,
          width: length,
          transform: [{ rotate: angle }],
        },
      ]}
    />
  );
}

const GOLDEN_AGE_COMPANIONS: ActiveCompanion[] = [
  {
    id: "casca",
    asset: companionCascaAsset,
    offsetX: -44,
    offsetY: 18,
    delay: 0,
    startCheckpointId: "cp-004",
    endCheckpointId: "cp-006",
  },
  {
    id: "griffith",
    asset: companionGriffithAsset,
    offsetX: 38,
    offsetY: 16,
    delay: 260,
    startCheckpointId: "cp-004",
    endCheckpointId: "cp-006",
  },
];

const JOURNEY_COMPANIONS: ActiveCompanion[] = [
  ...GOLDEN_AGE_COMPANIONS,
  {
    id: "casca-return",
    asset: companionCascaAsset,
    offsetX: 62,
    offsetY: -4,
    delay: 620,
    startCheckpointId: "cp-011",
  },
  {
    id: "skullknight",
    asset: companionSkullknightAsset,
    offsetX: 0,
    offsetY: -54,
    delay: 120,
    startCheckpointId: "cp-008",
    endCheckpointId: "cp-008-5",
  },
  {
    id: "isidro",
    asset: companionIsidroAsset,
    offsetX: -48,
    offsetY: 22,
    delay: 80,
    startCheckpointId: "cp-009",
  },
  {
    id: "farnese",
    asset: companionFarneseAsset,
    offsetX: 44,
    offsetY: 22,
    delay: 300,
    startCheckpointId: "cp-011",
  },
  {
    id: "serpico",
    asset: companionSerpicoAsset,
    offsetX: 0,
    offsetY: 52,
    delay: 420,
    startCheckpointId: "cp-011",
  },
  {
    id: "schierke",
    asset: companionSchierkeAsset,
    offsetX: -66,
    offsetY: -4,
    delay: 540,
    startCheckpointId: "cp-012",
  },
];

function getCheckpointThreshold(id: string): number {
  return BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === id)?.kmThreshold ?? 0;
}

function getActiveCompanions(totalDistanceKm: number): ActiveCompanion[] {
  return JOURNEY_COMPANIONS.filter((companion) => {
    const startKm = getCheckpointThreshold(companion.startCheckpointId);
    const endKm = companion.endCheckpointId
      ? getCheckpointThreshold(companion.endCheckpointId)
      : Number.POSITIVE_INFINITY;

    return totalDistanceKm >= startKm && totalDistanceKm <= endKm + 0.0001;
  });
}

function CompanionMarker({ companion, xPct, yPct }: { companion: ActiveCompanion; xPct: number; yPct: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    const timeout = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 920,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 920,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

      loop.start();
    }, companion.delay);

    return () => {
      clearTimeout(timeout);
      loop?.stop();
    };
  }, [companion.delay, pulse]);

  const translateY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Animated.View
      style={[
        styles.companionMarker,
        {
          left: `${xPct}%`,
          top: `${yPct}%`,
          marginLeft: companion.offsetX,
          marginTop: companion.offsetY,
          transform: [{ translateY }],
        },
      ]}
    >
      <Image source={companion.asset} style={styles.companionImage} resizeMode="contain" />
    </Animated.View>
  );
}

export function MapScreen() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(BASE_ZOOM);
  const [mapOffset, setMapOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const mapOffsetRef = useRef<MapOffset>({ x: 0, y: 0 });
  const dragStartRef = useRef<MapOffset>({ x: 0, y: 0 });
  const progress = usePlayerStore((state) => state.progress);
  const position = calculateGutsPosition(progress.totalDistanceKm, BERSERK_CHECKPOINTS);
  const activeCompanions = getActiveCompanions(progress.totalDistanceKm);
  const isJourneyComplete = position.previous.id === position.next.id;
  const remainingKm = Math.max(0, position.next.kmThreshold - progress.totalDistanceKm);
  const contentWidth = MAP_WIDTH * zoom;
  const contentHeight = MAP_HEIGHT * zoom;
  const selectedCheckpoint = BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === selectedCheckpointId);

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
          <View style={styles.mapOverlayRoute}>
            <View style={styles.mapOverlayBlock}>
              <Text style={styles.routeSummaryLabel}>Depuis</Text>
              <Text style={styles.routeSummaryTitle} numberOfLines={1}>
                {position.previous.title}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.blood.glow} />
            <View style={styles.mapOverlayBlock}>
              <Text style={styles.routeSummaryLabel}>Vers</Text>
              <Text style={styles.routeSummaryTitle} numberOfLines={1}>
                {isJourneyComplete ? JOURNEY_COMPLETE_TITLE : position.next.title}
              </Text>
            </View>
          </View>

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
              {!isJourneyComplete && (
                <RouteSegment
                  from={position.previous}
                  to={position.next}
                  contentWidth={contentWidth}
                  contentHeight={contentHeight}
                />
              )}
              {BERSERK_CHECKPOINTS.map((checkpoint, index) => {
                const isReached = checkpoint.kmThreshold <= progress.totalDistanceKm + 0.0001;
                const isFinalCheckpoint = index === BERSERK_CHECKPOINTS.length - 1;
                const isCurrentCheckpoint = checkpoint.id === position.previous.id;
                const isNextCheckpoint = !isJourneyComplete && checkpoint.id === position.next.id;

                return (
                  <Pressable
                    key={checkpoint.id}
                    style={[
                      styles.checkpointMarker,
                      !isReached && !isNextCheckpoint && styles.checkpointMarkerFuture,
                      { left: `${checkpoint.x}%`, top: `${checkpoint.y}%` },
                    ]}
                    onPress={() => setSelectedCheckpointId(checkpoint.id)}
                  >
                    <Image
                      source={isFinalCheckpoint ? finalCheckpointAsset : checkpointMarkerAsset}
                      style={[
                        styles.checkpointIcon,
                        isFinalCheckpoint && styles.finalCheckpointIcon,
                        !isReached && !isNextCheckpoint && styles.futureCheckpointIcon,
                      ]}
                      resizeMode="contain"
                    />
                    <View
                      style={[
                        styles.checkpointIndexBadge,
                        isReached && styles.checkpointIndexBadgeReached,
                        isCurrentCheckpoint && styles.checkpointIndexBadgeCurrent,
                        isNextCheckpoint && styles.checkpointIndexBadgeNext,
                      ]}
                    >
                      <Text style={styles.checkpointIndexText}>{index + 1}</Text>
                    </View>
                  </Pressable>
                );
              })}
              {activeCompanions.map((companion) => (
                <CompanionMarker
                  key={companion.id}
                  companion={companion}
                  xPct={position.x}
                  yPct={position.y}
                />
              ))}
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

          {selectedCheckpoint ? (
            <Pressable style={styles.checkpointTooltip} onPress={() => setSelectedCheckpointId(null)}>
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipArc}>{selectedCheckpoint.arc}</Text>
                <Ionicons name="close" size={16} color={theme.colors.text.muted} />
              </View>
              <Text style={styles.tooltipTitle}>{selectedCheckpoint.title}</Text>
              <Text style={styles.tooltipMeta}>{selectedCheckpoint.kmThreshold.toFixed(0)} km requis</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotReached]} />
            <Text style={styles.legendText}>Passe</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotNext]} />
            <Text style={styles.legendText}>Prochain</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Futur</Text>
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
    marginTop: theme.spacing.md,
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
  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  routeSummaryItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.72)",
    backgroundColor: "rgba(10,10,12,0.78)",
    padding: theme.spacing.sm,
  },
  routeSummaryLabel: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  routeSummaryTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: "700",
    marginTop: 2,
  },
  routeSegment: {
    position: "absolute",
    height: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(193,18,31,0.58)",
    shadowColor: theme.colors.blood.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
    elevation: 7,
    zIndex: 2,
  },
  mapOverlayRoute: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  mapOverlayBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.72)",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  mapControls: {
    position: "absolute",
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  mapControlButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  checkpointMarker: {
    position: "absolute",
    width: 46,
    height: 46,
    marginLeft: -23,
    marginTop: -23,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  checkpointMarkerFuture: {
    opacity: 0.46,
  },
  checkpointIcon: {
    width: 32,
    height: 32,
  },
  finalCheckpointIcon: {
    width: 42,
    height: 42,
  },
  futureCheckpointIcon: {
    opacity: 0.62,
  },
  checkpointIndexBadge: {
    position: "absolute",
    right: -5,
    bottom: -5,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(0,0,0,0.82)",
    paddingHorizontal: 3,
  },
  checkpointIndexBadgeReached: {
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(139,0,0,0.9)",
  },
  checkpointIndexBadgeCurrent: {
    borderColor: theme.colors.blood.glow,
    backgroundColor: "#C1121F",
    shadowColor: theme.colors.blood.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 7,
    elevation: 6,
  },
  checkpointIndexBadgeNext: {
    borderColor: "#D6B15E",
    backgroundColor: "rgba(92,63,12,0.96)",
  },
  checkpointIndexText: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  companionMarker: {
    position: "absolute",
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  companionImage: {
    width: 74,
    height: 74,
  },
  checkpointTooltip: {
    position: "absolute",
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    zIndex: 11,
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.7)",
    backgroundColor: "rgba(0,0,0,0.82)",
    padding: theme.spacing.sm,
  },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  tooltipArc: {
    color: theme.colors.blood.glow,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extraBold,
    textTransform: "uppercase",
  },
  tooltipTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.xs,
  },
  tooltipMeta: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
  },
  mapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(94,100,114,0.5)",
  },
  legendDotReached: {
    borderColor: theme.colors.blood.glow,
    backgroundColor: "#8B0000",
  },
  legendDotNext: {
    borderColor: "#D6B15E",
    backgroundColor: "#5C3F0C",
  },
  legendText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
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
