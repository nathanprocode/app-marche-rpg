import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polyline } from "react-native-svg";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../../features/mapJourney/interpolation";
import { usePlayerStore } from "../../store/usePlayerStore";
import { GutsMarker } from "../components/GutsMarker";

const worldMapAsset = require("../../../assets/map/world-map.png");
const MAP_WIDTH = 1448;
const MAP_HEIGHT = 1086;
const MIN_ZOOM = 0.8;
const BASE_ZOOM = 0.9;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.18;
const REACHED_TOLERANCE_KM = 0.0001;

type MapOffset = {
  x: number;
  y: number;
};

function toMapPoint(xPct: number, yPct: number): string {
  return `${(xPct / 100) * MAP_WIDTH},${(yPct / 100) * MAP_HEIGHT}`;
}

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [sheetHeight, setSheetHeight] = useState(0);
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

  const reachedCheckpoints = BERSERK_CHECKPOINTS.filter(
    (checkpoint) => checkpoint.kmThreshold <= progress.totalDistanceKm + REACHED_TOLERANCE_KM,
  );
  const walkedPath = [...reachedCheckpoints.map((checkpoint) => toMapPoint(checkpoint.x, checkpoint.y)), toMapPoint(position.x, position.y)].join(" ");
  const nextLegPath = `${toMapPoint(position.x, position.y)} ${toMapPoint(position.next.x, position.next.y)}`;

  /** La fiche du bas masque une partie de la carte : on centre le Traqué dans la zone visible. */
  const visibleHeight = Math.max(0, viewport.height - sheetHeight);

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
        y: visibleHeight / 2 - markerY,
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
  }, [position.x, position.y, viewport.height, viewport.width, sheetHeight]);

  function handleViewportLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  function handleSheetLayout(event: LayoutChangeEvent): void {
    setSheetHeight(event.nativeEvent.layout.height);
  }

  return (
    <View style={styles.root}>
      <View style={styles.mapViewport} onLayout={handleViewportLayout}>
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
            accessibilityLabel="Carte du monde de Berserk"
            source={worldMapAsset}
            style={{ width: contentWidth, height: contentHeight }}
            imageStyle={styles.mapImage}
          >
            <Svg width={contentWidth} height={contentHeight} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} style={StyleSheet.absoluteFill}>
              <Polyline points={walkedPath} fill="none" stroke={theme.colors.ink} strokeOpacity={0.4} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              <Polyline points={walkedPath} fill="none" stroke={theme.colors.bloodGlow} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              {isJourneyComplete ? null : (
                <Polyline points={nextLegPath} fill="none" stroke={theme.colors.ink} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 12" />
              )}
            </Svg>

            {BERSERK_CHECKPOINTS.map((checkpoint) => {
              const isReached = checkpoint.kmThreshold <= progress.totalDistanceKm + REACHED_TOLERANCE_KM;
              const isNext = !isJourneyComplete && checkpoint.id === position.next.id;
              const isPrevious = checkpoint.id === position.previous.id;

              return (
                <View key={checkpoint.id} pointerEvents="none" style={[styles.markerSlot, { left: `${checkpoint.x}%`, top: `${checkpoint.y}%` }]}>
                  <View style={[styles.diamond, isReached ? styles.diamondReached : styles.diamondAhead]} />
                  {isPrevious || isNext ? (
                    <View style={[styles.markerChip, isNext && styles.markerChipAbove]}>
                      <Text numberOfLines={1} style={styles.markerChipText}>
                        {checkpoint.title}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}

            <GutsMarker xPct={position.x} yPct={position.y} />
          </ImageBackground>
        </View>
      </View>

      <View pointerEvents="none" style={[styles.topScrim, { height: insets.top + theme.space[96] }]} />

      <View style={[styles.hud, { top: insets.top + theme.space[8] }]}>
        <View style={styles.distancePill} accessible accessibilityLabel={`${formatDecimal(progress.totalDistanceKm)} kilomètres sur ${GAME_CONFIG.totalGoalKm}`}>
          <Text style={styles.distanceValue}>{`${formatDecimal(progress.totalDistanceKm)} km`}</Text>
          <Text style={styles.distanceGoal}>{`sur ${formatInt(GAME_CONFIG.totalGoalKm)}`}</Text>
        </View>
        <View style={styles.controls}>
          <MapButton label="Agrandir la carte" icon="add" onPress={() => handleZoom(zoom + ZOOM_STEP)} />
          <MapButton label="Réduire la carte" icon="remove" onPress={() => handleZoom(zoom - ZOOM_STEP)} />
          <MapButton label="Recentrer sur ma position" icon="locate" onPress={() => handleZoom(BASE_ZOOM)} />
        </View>
      </View>

      <View style={styles.sheet} onLayout={handleSheetLayout}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.grabber} />
        <Text style={styles.kicker}>
          {`Point franchi · ${formatInt(position.previous.kmThreshold)} km · ${position.previous.arc}`}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {position.previous.title}
        </Text>
        <Text style={styles.description}>{position.previous.description}</Text>

        <View style={styles.nextRow}>
          <View style={styles.nextText}>
            <Text style={styles.nextLabel}>{isJourneyComplete ? "Périple accompli" : "Prochain point"}</Text>
            <Text style={styles.nextTitle}>
              {isJourneyComplete ? "Tu as atteint le dernier souvenir de la Traque." : position.next.title}
            </Text>
          </View>
          {isJourneyComplete ? null : <Text style={styles.nextKm}>{`${formatDecimal(remainingKm)} km`}</Text>}
        </View>
      </View>
    </View>
  );
}

type MapButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function MapButton({ label, icon, onPress }: MapButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.mapButton}>
      <Ionicons name={icon} size={20} color={theme.colors.bone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.ink },
  mapViewport: { ...StyleSheet.absoluteFillObject, overflow: "hidden", backgroundColor: theme.colors.ink },
  mapContent: { position: "absolute", top: 0, left: 0 },
  mapImage: { resizeMode: "stretch" },
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "rgba(12,10,9,0.55)" },
  markerSlot: { position: "absolute", width: 16, height: 16, marginLeft: -8, marginTop: -8 },
  diamond: {
    width: 16,
    height: 16,
    borderWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  diamondReached: { backgroundColor: theme.colors.bloodGlow, borderColor: theme.colors.bone },
  diamondAhead: { backgroundColor: theme.colors.bone, borderColor: theme.colors.bloodGlow },
  markerChip: {
    position: "absolute",
    top: 20,
    left: 0,
    paddingHorizontal: theme.space[8],
    paddingVertical: 2,
    backgroundColor: "rgba(12,10,9,0.88)",
  },
  // Le prochain point s'affiche au-dessus, le dernier franchi en dessous : les étiquettes ne se chevauchent plus.
  markerChipAbove: { top: -40 },
  markerChipText: { ...theme.text.displayS, fontSize: 16, lineHeight: 24, color: theme.colors.bone },
  hud: {
    position: "absolute",
    left: theme.space[24],
    right: theme.space[24],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.space[8],
    paddingVertical: theme.space[8],
    paddingHorizontal: theme.space[16],
    backgroundColor: "rgba(12,10,9,0.9)",
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
  },
  distanceValue: { ...theme.text.displayM, color: theme.colors.bone },
  distanceGoal: { ...theme.text.small, color: theme.colors.boneDim },
  controls: { gap: theme.space[8] },
  mapButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,10,9,0.9)",
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.space[24],
    paddingTop: theme.space[16],
    paddingBottom: theme.space[24],
    backgroundColor: theme.colors.bone,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ink,
  },
  grabber: {
    alignSelf: "center",
    width: 32,
    height: 4,
    marginBottom: theme.space[16],
    backgroundColor: "rgba(12,10,9,0.25)",
  },
  kicker: { ...theme.text.label, color: theme.colors.blood },
  title: { ...theme.text.displayM, color: theme.colors.ink },
  description: { ...theme.text.small, color: theme.colors.umber, marginTop: theme.space[8] },
  nextRow: {
    marginTop: theme.space[16],
    paddingTop: theme.space[16],
    borderTopWidth: 1,
    borderTopColor: "rgba(12,10,9,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space[16],
  },
  nextText: { flex: 1 },
  nextLabel: { ...theme.text.label, color: theme.colors.umber },
  nextTitle: { ...theme.text.bodyStrong, color: theme.colors.ink },
  nextKm: { ...theme.text.displayM, color: theme.colors.blood },
});
