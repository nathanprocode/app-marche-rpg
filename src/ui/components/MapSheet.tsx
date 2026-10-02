import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { theme } from "../../core/theme";

type MapSheetProps = {
  /** Toujours visible, même fiche baissée (titre du point franchi). Sert aussi de poignée à faire glisser. */
  header: ReactNode;
  /** Masqué quand la fiche est baissée. */
  children: ReactNode;
  /** Hauteur de carte cachée par la fiche (en px), pour centrer Guts dans ce qui reste visible. */
  onCoveredHeightChange: (height: number) => void;
};

/** Distance ou vitesse de glissement au-delà de laquelle la fiche bascule dans l'autre position. */
const SNAP_VELOCITY = 0.3;
const SNAP_DURATION_MS = 220;

/** Fiche du bas de la carte : on la baisse en la faisant glisser ou en touchant la poignée. */
export function MapSheet({ header, children, onCoveredHeightChange }: MapSheetProps) {
  const reduceMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const [peekHeight, setPeekHeight] = useState(0);
  const collapsedOffset = Math.max(0, fullHeight - peekHeight);

  // Lus par les gestes : les valeurs à jour, sans recréer le PanResponder à chaque rendu.
  const stateRef = useRef({ isCollapsed, collapsedOffset, dragStart: 0 });
  stateRef.current.isCollapsed = isCollapsed;
  stateRef.current.collapsedOffset = collapsedOffset;

  function snapTo(collapsed: boolean): void {
    const toValue = collapsed ? stateRef.current.collapsedOffset : 0;
    if (reduceMotion) {
      translateY.setValue(toValue);
    } else {
      Animated.timing(translateY, {
        toValue,
        duration: SNAP_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    setIsCollapsed(collapsed);
    onCoveredHeightChange(collapsed ? peekHeight : fullHeight);
  }

  const snapRef = useRef(snapTo);
  snapRef.current = snapTo;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Phase de capture : la fiche prend le geste avant la poignée (un bouton, qui le garderait sinon).
        // Seulement un glissement vertical : un simple toucher reste pour la poignée.
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const { isCollapsed: collapsed, collapsedOffset: offset } = stateRef.current;
          stateRef.current.dragStart = collapsed ? offset : 0;
        },
        onPanResponderMove: (_event, gesture) => {
          const { dragStart, collapsedOffset: offset } = stateRef.current;
          translateY.setValue(Math.max(0, Math.min(offset, dragStart + gesture.dy)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const { dragStart, collapsedOffset: offset } = stateRef.current;
          const position = dragStart + gesture.dy;
          const collapse =
            gesture.vy > SNAP_VELOCITY || (gesture.vy > -SNAP_VELOCITY && position > offset / 2);
          snapRef.current(collapse);
        },
      }),
    [translateY],
  );

  function handleSheetLayout(event: LayoutChangeEvent): void {
    const height = event.nativeEvent.layout.height;
    setFullHeight(height);
    if (!isCollapsed) onCoveredHeightChange(height);
  }

  function handleHeaderLayout(event: LayoutChangeEvent): void {
    const { y, height } = event.nativeEvent.layout;
    // Fiche baissée : on garde la poignée et le titre, plus une marge en dessous.
    setPeekHeight(y + height + theme.space[16]);
  }

  // Le contenu change de hauteur (nouveau point franchi) pendant que la fiche est baissée : on la recale.
  // Volontairement déclenché par collapsedOffset seul : basculer la fiche passe déjà par snapTo.
  useEffect(() => {
    if (isCollapsed) {
      translateY.setValue(collapsedOffset);
      onCoveredHeightChange(peekHeight);
    }
  }, [collapsedOffset]);

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} onLayout={handleSheetLayout}>
      <View {...panResponder.panHandlers} onLayout={handleHeaderLayout}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? "Afficher la fiche du point" : "Baisser la fiche du point"}
          onPress={() => snapTo(!isCollapsed)}
          hitSlop={{ top: 12, bottom: 4, left: 24, right: 24 }}
          style={styles.grabberZone}
        >
          <View style={styles.grabber} />
        </Pressable>
        {header}
      </View>
      {/* Masqué fiche baissée : sinon le haut de la description dépasse sous le titre. */}
      <View
        style={isCollapsed && styles.hidden}
        accessibilityElementsHidden={isCollapsed}
        importantForAccessibility={isCollapsed ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.space[24],
    paddingTop: theme.space[8],
    paddingBottom: theme.space[24],
    backgroundColor: theme.colors.bone,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ink,
  },
  // Zone de toucher bien plus grande que le trait de la poignée (44 px de haut au total).
  grabberZone: {
    alignSelf: "center",
    paddingTop: theme.space[8],
    paddingBottom: theme.space[16],
    paddingHorizontal: theme.space[24],
  },
  grabber: { width: 32, height: 4, backgroundColor: "rgba(12,10,9,0.25)" },
  hidden: { opacity: 0 },
});
