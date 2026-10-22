import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { theme } from "../../core/theme";

/** Hauteur de la coupe en biais du bas d'une case. */
const SLANT_HEIGHT = 24;

type PanelProps = {
  children?: ReactNode;
  /** Case inversée : fond noir, pour le texte en blanc (bandeaux, légendes). */
  reversed?: boolean;
  /** Bord bas coupé en biais, remontant vers la droite : une case par écran au plus. */
  slant?: boolean;
  /** Marges intérieures (16 px) ; à désactiver pour une image pleine case. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Lue d'un seul tenant par TalkBack, avec ce libellé. */
  accessible?: boolean;
  accessibilityLabel?: string;
};

/**
 * Une case de la planche. Posée sur une page noire (Screen variant « page »), la gouttière entre deux cases
 * suffit à les séparer : pas de bordure, pas d'ombre, angles vifs.
 */
export function Panel({
  children,
  reversed = false,
  slant = false,
  padded = true,
  style,
  accessible,
  accessibilityLabel,
}: PanelProps) {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.panel,
        reversed && styles.reversed,
        padded && styles.padded,
        slant && padded && styles.slantRoom,
        style,
      ]}
    >
      {children}
      {slant ? (
        <View pointerEvents="none" style={styles.slant} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
            <Polygon points="100,0 100,10 0,10" fill={theme.colors.black} />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: theme.colors.paper, overflow: "hidden" },
  // Une case noire posée sur la gouttière noire : un cadre gris foncé garde la lecture en cases.
  reversed: { backgroundColor: theme.colors.black, borderWidth: theme.frame, borderColor: theme.colors.toneDark },
  padded: { padding: theme.space[16] },
  slantRoom: { paddingBottom: theme.space[16] + SLANT_HEIGHT },
  // Tenue par ses bords, pas par une largeur en % : sur Android, le % d'un élément absolu se calcule sans les marges
  // intérieures de la case, et la coupe s'arrêtait avant le bord droit. Le SVG remplit cette vue (sur le web, un SVG
  // absolu ne s'étire pas seul entre left et right).
  slant: { position: "absolute", left: 0, right: 0, bottom: 0, height: SLANT_HEIGHT },
});
