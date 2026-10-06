import { Ionicons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { GUTS_SKINS } from "../../data/gutsSkins";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { getTravelingCompanions, layoutTroupe } from "../../features/companions/journey";
import { calculateGutsPosition } from "../../features/mapJourney/interpolation";
import {
  MAP_BASE_ZOOM,
  MAP_MAX_ZOOM,
  anchorUnder,
  clampMapOffset,
  clampZoom,
  dotsAlongPath,
  fitZoom,
  gestureTransform,
  isInRect,
  pinchZoom,
  touchDistance,
  touchFocal,
  viewForAnchor,
  visibleMapRect,
  type MapView,
  type Offset,
} from "../../features/mapZoom/mapZoom";
import { resolveGutsSkin } from "../../features/skins/gutsSkin";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSocialStore } from "../../store/useSocialStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BandMarker } from "../components/BandMarker";
import { COMPANION_SPRITE_SIZE, CompanionMarker } from "../components/CompanionMarker";
import { GutsMarker } from "../components/GutsMarker";
import { MapSheet } from "../components/MapSheet";

const worldMapAsset = require("../../../assets/map/world-map.png");
const MAP_WIDTH = 1448;
const MAP_HEIGHT = 1086;
const MAP_SIZE = { width: MAP_WIDTH, height: MAP_HEIGHT };
/** Chaque appui sur + ou - multiplie (ou divise) le zoom par ce facteur. */
const ZOOM_FACTOR = 1.35;
const REACHED_TOLERANCE_KM = 0.0001;
/** Piste de pas : taille des points et écart entre eux, en pixels à l'écran (constants quel que soit le zoom). */
const TRAIL_DOT_PX = 5;
const TRAIL_GAP_PX = 13;
/** Contour clair sous chaque point de la piste, pour rester lisible sur la terre comme sur la mer. */
const TRAIL_OUTLINE_PX = 1.5;
const NEXT_LEG_DOT_PX = 3;
const NEXT_LEG_GAP_PX = 10;
/** Les points ne sont posés qu'autour de la zone visible (un cadre de marge de chaque côté), pour garder peu de vues. */
const TRAIL_MARGIN = 1;
const TRAIL_DOT_SIZE = TRAIL_DOT_PX + 2 * TRAIL_OUTLINE_PX;

function toMapPoint(xPct: number, yPct: number): Offset {
  return { x: (xPct / 100) * MAP_WIDTH, y: (yPct / 100) * MAP_HEIGHT };
}

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [sheetHeight, setSheetHeight] = useState(0);
  const [zoom, setZoom] = useState(MAP_BASE_ZOOM);
  const [mapOffset, setMapOffset] = useState<Offset>({ x: 0, y: 0 });
  // Vue « vivante » lue par les gestes sans passer par un rendu ; l'écran la suit à chaque image.
  const viewRef = useRef<MapView>({ zoom: MAP_BASE_ZOOM, offset: { x: 0, y: 0 } });
  const viewportRef = useRef({ width: 0, height: 0 });
  const viewportNodeRef = useRef<View>(null);
  const viewportOriginRef = useRef<Offset>({ x: 0, y: 0 });
  // Pendant un geste, la carte n'est pas redessinée : elle est déplacée et agrandie par ces valeurs animées.
  const transformRef = useRef({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale: new Animated.Value(1),
  });
  /** Zoom du dernier rendu : la taille réelle de la carte à l'écran, que la transformation agrandit pendant un geste. */
  const layoutZoomRef = useRef(MAP_BASE_ZOOM);
  layoutZoomRef.current = zoom;
  const isGesturingRef = useRef(false);
  /** Dès que l'utilisateur déplace ou zoome la carte, elle ne se recentre plus d'elle-même sur Guts. */
  const userMovedRef = useRef(false);
  const gestureRef = useRef({ touchCount: 0, anchor: { x: 0, y: 0 } as Offset, startDistance: 0, startZoom: MAP_BASE_ZOOM });
  const progress = usePlayerStore((state) => state.progress);
  const position = calculateGutsPosition(progress.totalDistanceKm, BERSERK_CHECKPOINTS);
  const gutsSkinId = useSettingsStore((state) => state.gutsSkinId);
  const gutsSkin = resolveGutsSkin(GUTS_SKINS, gutsSkinId, progress, BERSERK_CHECKPOINTS);
  const myId = useAuthStore((state) => state.userId);
  const bandMembers = useSocialStore((state) => state.members);
  // Les amis de la Bande : un point et un nom, sans toi (tu es Guts).
  const friends = bandMembers
    .filter((member) => member.uid !== myId)
    .sort((a, b) => a.totalDistanceKm - b.totalDistanceKm)
    .map((member) => ({ member, spot: calculateGutsPosition(member.totalDistanceKm, BERSERK_CHECKPOINTS) }));
  // Sans sprite, un compagnon n'a rien à dessiner sur la carte : il reste dans la collection.
  const travelingCompanions = getTravelingCompanions(progress.totalDistanceKm, COMPANIONS, BERSERK_CHECKPOINTS).filter(
    (companion) => companion.image,
  );
  const isJourneyComplete = position.previous.id === position.next.id;
  const remainingKm = Math.max(0, position.next.kmThreshold - progress.totalDistanceKm);
  const contentWidth = MAP_WIDTH * zoom;
  const contentHeight = MAP_HEIGHT * zoom;
  const gutsXPx = (position.x / 100) * contentWidth;
  const troupeOffsets = layoutTroupe(
    travelingCompanions.length,
    gutsXPx,
    contentWidth - gutsXPx,
    COMPANION_SPRITE_SIZE / 2,
  );

  const reachedCheckpoints = BERSERK_CHECKPOINTS.filter(
    (checkpoint) => checkpoint.kmThreshold <= progress.totalDistanceKm + REACHED_TOLERANCE_KM,
  );
  const walkedPath = [...reachedCheckpoints.map((checkpoint) => toMapPoint(checkpoint.x, checkpoint.y)), toMapPoint(position.x, position.y)];
  const nextLegPath = [toMapPoint(position.x, position.y), toMapPoint(position.next.x, position.next.y)];

  /** La fiche du bas masque une partie de la carte : on centre le Traqué dans la zone visible. */
  const visibleHeight = Math.max(0, viewport.height - sheetHeight);
  // Le cadre des gestes est la zone visible au-dessus de la fiche : la carte dézoomée s'y centre entièrement.
  const frame = { width: viewport.width, height: visibleHeight > 0 ? visibleHeight : viewport.height };
  viewportRef.current = frame;
  const minZoom = fitZoom(MAP_SIZE, frame);
  // Piste en points de taille constante à l'écran. Ce sont de petites vues : un SVG aussi grand que la carte zoomée
  // demandait sur Android une image de plus de 100 Mo, ce qui ralentissait le pincement puis fermait l'app.
  const trailArea = visibleMapRect({ zoom, offset: mapOffset }, frame, TRAIL_MARGIN);
  const trailDots = dotsAlongPath(walkedPath, (TRAIL_DOT_PX + TRAIL_GAP_PX) / zoom).filter((dot) => isInRect(dot, trailArea));
  const nextLegDots = isJourneyComplete
    ? []
    : dotsAlongPath(nextLegPath, (NEXT_LEG_DOT_PX + NEXT_LEG_GAP_PX) / zoom).filter((dot) => isInRect(dot, trailArea));

  /** Applique la vue à la transformation de la carte, sans rendu. */
  function applyTransform(view: MapView): void {
    const { translateX, translateY, scale } = gestureTransform(view, layoutZoomRef.current, MAP_SIZE);
    transformRef.current.translateX.setValue(translateX);
    transformRef.current.translateY.setValue(translateY);
    transformRef.current.scale.setValue(scale);
  }

  /** Redessine la carte à la vue courante (taille réelle, piste). Pendant un geste, on attend que les doigts se lèvent. */
  function commitView(): void {
    setZoom(viewRef.current.zoom);
    setMapOffset(viewRef.current.offset);
  }

  /** Pose la vue tout de suite à l'écran ; hors geste (boutons, recentrage), la carte est aussi redessinée. */
  function setView(next: MapView): void {
    viewRef.current = next;
    applyTransform(next);
    if (!isGesturingRef.current) commitView();
  }

  function endGesture(): void {
    isGesturingRef.current = false;
    commitView();
  }

  function gutsCenteredView(zoomValue: number): MapView {
    const area = viewportRef.current;
    const anchor = { x: (position.x / 100) * MAP_WIDTH, y: (position.y / 100) * MAP_HEIGHT };
    return viewForAnchor(anchor, { x: area.width / 2, y: area.height / 2 }, zoomValue, MAP_SIZE, area);
  }

  function recenterOnGuts(zoomValue: number): void {
    userMovedRef.current = false;
    setView(gutsCenteredView(zoomValue));
  }

  function handleZoomButton(nextZoom: number): void {
    recenterOnGuts(clampZoom(nextZoom, fitZoom(MAP_SIZE, viewportRef.current), MAP_MAX_ZOOM));
  }

  /** Position d'un geste dans le cadre de la carte (les pages de l'écran moins l'origine du cadre). */
  function focalOf(event: GestureResponderEvent): Offset | null {
    const touches = event.nativeEvent.touches;
    // Sans touches (souris sur le web), on prend le point de l'événement.
    const point = touchFocal(touches) ?? { pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY };
    if (point.pageX === undefined) return null;
    return { x: point.pageX - viewportOriginRef.current.x, y: point.pageY - viewportOriginRef.current.y };
  }

  /** Nouveau point de départ du geste : au début, et quand un doigt se pose ou se lève. */
  function rebase(event: GestureResponderEvent): void {
    const touches = event.nativeEvent.touches;
    const focal = focalOf(event);
    const gesture = gestureRef.current;
    gesture.touchCount = touches.length;
    gesture.startZoom = viewRef.current.zoom;
    gesture.startDistance = touches.length >= 2 ? touchDistance(touches[0], touches[1]) : 0;
    if (focal) gesture.anchor = anchorUnder(viewRef.current, focal);
  }

  function moveGesture(event: GestureResponderEvent): void {
    const touches = event.nativeEvent.touches;
    if (touches.length !== gestureRef.current.touchCount) rebase(event);
    const focal = focalOf(event);
    if (!focal) return;

    const gesture = gestureRef.current;
    const area = viewportRef.current;
    const nextZoom =
      touches.length >= 2
        ? pinchZoom(gesture.startZoom, gesture.startDistance, touchDistance(touches[0], touches[1]), fitZoom(MAP_SIZE, area))
        : viewRef.current.zoom;

    userMovedRef.current = true;
    setView(viewForAnchor(gesture.anchor, focal, nextZoom, MAP_SIZE, area));
  }

  // Le PanResponder est créé une fois : il lit la vue par les refs, car il serait sinon remplacé en plein geste
  // à chaque changement de zoom, et le pincement s'arrêterait.
  const handlersRef = useRef({ rebase, moveGesture, endGesture });
  handlersRef.current = { rebase, moveGesture, endGesture };
  const mapPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (event, gesture) =>
        event.nativeEvent.touches.length >= 2 || Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        isGesturingRef.current = true;
        handlersRef.current.rebase(event);
      },
      onPanResponderMove: (event) => handlersRef.current.moveGesture(event),
      onPanResponderRelease: () => handlersRef.current.endGesture(),
      onPanResponderTerminate: () => handlersRef.current.endGesture(),
    }),
  ).current;

  // Le Traqué avance (ou le cadre change) : on recentre, sauf si l'utilisateur est parti explorer la carte.
  useEffect(() => {
    if (!viewport.width || !viewport.height || userMovedRef.current) return;
    const target = gutsCenteredView(clampZoom(viewRef.current.zoom, minZoom));
    setView(target);
  }, [position.x, position.y, viewport.height, viewport.width, sheetHeight]);

  // Après un rendu à la nouvelle taille, la transformation retombe à l'échelle 1 (un doigt peut déjà être reposé).
  useLayoutEffect(() => {
    applyTransform(viewRef.current);
  }, [zoom, mapOffset]);

  function handleViewportLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
    // Origine du cadre dans la fenêtre : les doigts sont mesurés en coordonnées de la fenêtre.
    viewportNodeRef.current?.measureInWindow((x, y) => {
      viewportOriginRef.current = { x, y };
    });
  }

  return (
    <View style={styles.root}>
      <View ref={viewportNodeRef} style={styles.mapViewport} onLayout={handleViewportLayout}>
        <Animated.View
          {...mapPanResponder.panHandlers}
          style={[
            styles.mapContent,
            {
              width: contentWidth,
              height: contentHeight,
              transform: [
                { translateX: transformRef.current.translateX },
                { translateY: transformRef.current.translateY },
                { scale: transformRef.current.scale },
              ],
            },
          ]}
        >
          <ImageBackground
            accessibilityLabel="Carte du monde de Berserk"
            source={worldMapAsset}
            style={{ width: contentWidth, height: contentHeight }}
            imageStyle={styles.mapImage}
          >
            {/* Piste de pas : des points espacés d'une taille constante à l'écran, clairs sous foncés pour rester lisibles sur la terre comme sur la mer. */}
            {nextLegDots.map((dot, index) => (
              <View
                key={`next-${index}`}
                pointerEvents="none"
                style={[styles.nextLegDot, { left: dot.x * zoom - NEXT_LEG_DOT_PX / 2, top: dot.y * zoom - NEXT_LEG_DOT_PX / 2 }]}
              />
            ))}
            {trailDots.map((dot, index) => (
              <View
                key={`trail-${index}`}
                pointerEvents="none"
                style={[styles.trailDot, { left: dot.x * zoom - TRAIL_DOT_SIZE / 2, top: dot.y * zoom - TRAIL_DOT_SIZE / 2 }]}
              />
            ))}

            {BERSERK_CHECKPOINTS.map((checkpoint) => {
              const isReached = checkpoint.kmThreshold <= progress.totalDistanceKm + REACHED_TOLERANCE_KM;
              const isNext = !isJourneyComplete && checkpoint.id === position.next.id;
              const isPrevious = checkpoint.id === position.previous.id;

              return (
                <View key={checkpoint.id} pointerEvents="none" style={[styles.markerSlot, { left: `${checkpoint.x}%`, top: `${checkpoint.y}%` }]}>
                  <View style={[styles.diamond, isReached ? styles.diamondReached : styles.diamondAhead]} />
                  {isPrevious || isNext ? (
                    <View style={[styles.markerChipLane, isNext && styles.markerChipAbove]}>
                      <View style={styles.markerChip}>
                        <Text numberOfLines={1} style={styles.markerChipText}>
                          {checkpoint.title}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}

            {travelingCompanions.map((companion, index) => (
              <CompanionMarker
                key={companion.id}
                companion={companion}
                xPct={position.x}
                yPct={position.y}
                offsetX={troupeOffsets[index]}
                index={index}
              />
            ))}
            {friends.map(({ member, spot }, index) => (
              <BandMarker key={member.uid} name={member.displayName} lap={member.lap} xPct={spot.x} yPct={spot.y} index={index} />
            ))}
            <GutsMarker xPct={position.x} yPct={position.y} skin={gutsSkin} />
          </ImageBackground>
        </Animated.View>
      </View>

      <View pointerEvents="none" style={[styles.topScrim, { height: insets.top + theme.space[96] }]} />

      <View style={[styles.hud, { top: insets.top + theme.space[8] }]}>
        <View style={styles.distancePill} accessible accessibilityLabel={`${formatDecimal(progress.totalDistanceKm)} kilomètres sur ${GAME_CONFIG.totalGoalKm}`}>
          <Text style={styles.distanceValue}>{`${formatDecimal(progress.totalDistanceKm)} km`}</Text>
          <Text style={styles.distanceGoal}>{`sur ${formatInt(GAME_CONFIG.totalGoalKm)}`}</Text>
        </View>
        <View style={styles.controls}>
          <MapButton label="Agrandir la carte" icon="add" onPress={() => handleZoomButton(zoom * ZOOM_FACTOR)} />
          <MapButton label="Réduire la carte" icon="remove" onPress={() => handleZoomButton(zoom / ZOOM_FACTOR)} />
          <MapButton label="Recentrer sur ma position" icon="locate" onPress={() => handleZoomButton(MAP_BASE_ZOOM)} />
        </View>
      </View>

      <MapSheet
        onCoveredHeightChange={setSheetHeight}
        header={
          <>
            <Text style={styles.kicker}>
              {`Point franchi · ${formatInt(position.previous.kmThreshold)} km · ${position.previous.arc}`}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {position.previous.title}
            </Text>
          </>
        }
      >
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
      </MapSheet>
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
  // overflow hidden : la fiche baissée descend sous l'écran, elle ne doit pas déborder sur la barre d'onglets.
  root: { flex: 1, overflow: "hidden", backgroundColor: theme.colors.ink },
  mapViewport: { ...StyleSheet.absoluteFillObject, overflow: "hidden", backgroundColor: theme.colors.ink },
  mapContent: { position: "absolute", top: 0, left: 0 },
  mapImage: { resizeMode: "stretch" },
  trailDot: {
    position: "absolute",
    width: TRAIL_DOT_SIZE,
    height: TRAIL_DOT_SIZE,
    borderRadius: TRAIL_DOT_SIZE / 2,
    borderWidth: TRAIL_OUTLINE_PX,
    borderColor: "rgba(233,225,207,0.9)",
    backgroundColor: theme.colors.blood,
  },
  nextLegDot: {
    position: "absolute",
    width: NEXT_LEG_DOT_PX,
    height: NEXT_LEG_DOT_PX,
    borderRadius: NEXT_LEG_DOT_PX / 2,
    backgroundColor: theme.colors.ink,
    opacity: 0.55,
  },
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
  // Couloir large où l'étiquette prend la largeur de son texte. Sans lui, sur Android, l'étiquette ne peut pas
  // dépasser les 16 px du losange : le texte disparaît et il ne reste qu'un carré noir.
  markerChipLane: { position: "absolute", top: 20, left: 0, width: 280, alignItems: "flex-start" },
  markerChip: {
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
