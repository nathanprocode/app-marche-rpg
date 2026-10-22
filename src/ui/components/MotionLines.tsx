import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { theme } from "../../core/theme";

const LINE_COUNT = 18;

/**
 * Traits fixes (pas d'aléatoire au rendu), dans un repère 100 × 100 étiré sur la case : chacun part du bord droit
 * avec sa propre longueur et son épaisseur.
 */
const LINES = Array.from({ length: LINE_COUNT }, (_, i) => {
  const jitter = ((i * 37) % 11) / 11;
  const y = ((i + 0.5) / LINE_COUNT) * 100 + (jitter - 0.5) * 3;
  const length = 35 + (((i * 53) % 13) / 13) * 60;
  const thickness = 0.8 + (((i * 29) % 7) / 7) * 2.2;
  return `100,${y - thickness / 2} 100,${y + thickness / 2} ${100 - length},${y}`;
});

type MotionLinesProps = {
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lignes de mouvement : des traits effilés qui filent du bord droit vers la gauche, la route qui reste à faire.
 * Décor discret de la case de la Traque (trame claire) ; les lignes de concentration (SpeedLines) restent aux
 * grands moments.
 */
export function MotionLines({ color = theme.colors.toneLight, style }: MotionLinesProps) {
  return (
    // Le SVG remplit une vue tenue par ses bords (voir Screentone) : sa taille ne dépend ni du web ni des marges.
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINES.map((points, i) => (
          <Polygon key={i} points={points} fill={color} />
        ))}
      </Svg>
    </View>
  );
}
