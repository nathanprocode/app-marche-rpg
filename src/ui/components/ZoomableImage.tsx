import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { theme } from "../../core/theme";
import {
  DOUBLE_TAP_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  clampOffset,
  clampScale,
  containSize,
  distanceBetween,
  pinchScale,
  toggleScale,
  type Offset,
  type Size,
} from "../../features/zoom/zoomMath";

type ZoomableImageProps = {
  source: ImageSourcePropType;
  accessibilityLabel?: string;
};

/**
 * Taille d'origine d'une image locale. resolveAssetSource n'existe que sur téléphone ; sur le web, l'asset
 * porte parfois sa taille. Inconnue : { 0, 0 }, et les limites de déplacement se calent sur le cadre.
 */
function readImageSize(source: ImageSourcePropType): Size {
  const asset =
    typeof Image.resolveAssetSource === "function"
      ? Image.resolveAssetSource(source)
      : (source as { width?: number; height?: number } | null);
  return { width: asset?.width ?? 0, height: asset?.height ?? 0 };
}

/** Position du premier doigt, ou de la souris sur le web (pas de « touches » pour une souris). */
function pointOf(event: GestureResponderEvent): Offset {
  const [touch] = event.nativeEvent.touches;
  const source = touch ?? event.nativeEvent;
  return { x: source.pageX, y: source.pageY };
}

const DOUBLE_TAP_MS = 300;
/** Au-delà de ce déplacement (px), le geste n'est plus un toucher mais un glissement. */
const TAP_SLOP = 8;
const ANIMATION_MS = 200;

/**
 * Image qu'on agrandit en pinçant à deux doigts (jusqu'à x4), qu'on déplace à un doigt une fois agrandie,
 * et qui bascule entre taille normale et x2,5 par un double toucher. Boutons + / - / taille normale en plus,
 * pour la souris et TalkBack.
 */
export function ZoomableImage({ source, accessibilityLabel }: ZoomableImageProps) {
  const reduceMotion = useReducedMotion();
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [scaleLabel, setScaleLabel] = useState(MIN_SCALE);
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const imageSize = useMemo(() => readImageSize(source), [source]);

  // État du geste, lu et modifié par le PanResponder sans provoquer de rendu.
  const gesture = useRef({
    scale: MIN_SCALE,
    offset: { x: 0, y: 0 } as Offset,
    touchCount: 0,
    startScale: MIN_SCALE,
    startDistance: 0,
    startOffset: { x: 0, y: 0 } as Offset,
    /** Position du doigt (ou de la souris) au début du geste en cours. */
    startPoint: { x: 0, y: 0 } as Offset,
    moved: false,
    lastTapAt: 0,
  }).current;
  const sizesRef = useRef({ viewport, content: viewport });
  sizesRef.current = { viewport, content: containSize(imageSize, viewport) };

  function apply(nextScale: number, nextOffset: Offset): void {
    gesture.scale = nextScale;
    gesture.offset = nextOffset;
    scale.setValue(nextScale);
    translateX.setValue(nextOffset.x);
    translateY.setValue(nextOffset.y);
  }

  function animateTo(nextScale: number, nextOffset: Offset): void {
    const { content, viewport: frame } = sizesRef.current;
    const target = clampOffset(nextOffset, nextScale, content, frame);
    gesture.scale = nextScale;
    gesture.offset = target;
    setScaleLabel(nextScale);
    if (reduceMotion) {
      apply(nextScale, target);
      return;
    }
    Animated.parallel([
      Animated.timing(scale, { toValue: nextScale, duration: ANIMATION_MS, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: target.x, duration: ANIMATION_MS, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: target.y, duration: ANIMATION_MS, useNativeDriver: true }),
    ]).start();
  }

  const animateRef = useRef(animateTo);
  animateRef.current = animateTo;

  /** Nouveau point de départ du geste (au début, ou quand un doigt se pose ou se lève). */
  function rebase(event: GestureResponderEvent): void {
    const touches = event.nativeEvent.touches;
    gesture.touchCount = touches.length;
    gesture.startScale = gesture.scale;
    gesture.startOffset = gesture.offset;
    gesture.startDistance = touches.length >= 2 ? distanceBetween(touches[0], touches[1]) : 0;
    gesture.startPoint = pointOf(event);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          gesture.moved = false;
          rebase(event);
        },
        onPanResponderMove: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length !== gesture.touchCount) rebase(event);

          const point = pointOf(event);
          const dx = point.x - gesture.startPoint.x;
          const dy = point.y - gesture.startPoint.y;
          if (touches.length > 1 || Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) {
            gesture.moved = true;
          }

          const { content, viewport: frame } = sizesRef.current;
          if (touches.length >= 2) {
            const nextScale = pinchScale(gesture.startScale, gesture.startDistance, distanceBetween(touches[0], touches[1]));
            apply(nextScale, clampOffset(gesture.startOffset, nextScale, content, frame));
          } else if (gesture.scale > MIN_SCALE) {
            const nextOffset = { x: gesture.startOffset.x + dx, y: gesture.startOffset.y + dy };
            apply(gesture.scale, clampOffset(nextOffset, gesture.scale, content, frame));
          }
        },
        onPanResponderRelease: () => {
          setScaleLabel(gesture.scale);
          if (gesture.moved) return;

          const now = Date.now();
          if (now - gesture.lastTapAt < DOUBLE_TAP_MS) {
            gesture.lastTapAt = 0;
            animateRef.current(toggleScale(gesture.scale), { x: 0, y: 0 });
          } else {
            gesture.lastTapAt = now;
          }
        },
      }),
    // Les valeurs animées et l'objet gesture sont stables : on ne recrée pas le PanResponder.
    [],
  );

  // Nouvelle planche : on repart de la taille normale.
  useEffect(() => {
    apply(MIN_SCALE, { x: 0, y: 0 });
    setScaleLabel(MIN_SCALE);
  }, [source]);

  function handleLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  const isZoomed = scaleLabel > MIN_SCALE + 0.01;

  return (
    <View style={styles.root}>
      <View style={styles.viewport} onLayout={handleLayout} {...panResponder.panHandlers}>
        <Animated.Image
          source={source}
          resizeMode="contain"
          accessibilityLabel={accessibilityLabel}
          accessibilityIgnoresInvertColors
          style={[styles.image, { transform: [{ translateX }, { translateY }, { scale }] }]}
        />
      </View>

      <View style={styles.controls}>
        <ZoomButton
          label="Dézoomer"
          icon="remove"
          disabled={!isZoomed}
          onPress={() => animateTo(clampScale(gesture.scale / 1.5), gesture.offset)}
        />
        <ZoomButton
          label="Taille normale"
          icon="contract"
          disabled={!isZoomed}
          onPress={() => animateTo(MIN_SCALE, { x: 0, y: 0 })}
        />
        <ZoomButton
          label="Zoomer"
          icon="add"
          disabled={scaleLabel >= MAX_SCALE - 0.01}
          onPress={() => animateTo(isZoomed ? clampScale(gesture.scale * 1.5) : DOUBLE_TAP_SCALE, gesture.offset)}
        />
      </View>
    </View>
  );
}

type ZoomButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  disabled: boolean;
  onPress: () => void;
};

function ZoomButton({ label, icon, disabled, onPress }: ZoomButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Ionicons name={icon} size={20} color={theme.colors.bone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: "100%" },
  viewport: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.space[16],
    paddingTop: theme.space[16],
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
    backgroundColor: theme.colors.inkRaised,
  },
  buttonDisabled: { opacity: 0.4 },
});
