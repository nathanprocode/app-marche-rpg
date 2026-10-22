import { useId } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { theme } from "../../core/theme";

type ScreentoneProps = {
  /** Écart entre deux points, en px : plus il est petit, plus la trame est dense. */
  step?: number;
  /** Rayon des points, en px. */
  dot?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Trame de points, comme celles collées sur les planches. Remplit son parent (position absolue par défaut).
 * Le SVG remplit une vue tenue par ses bords : sur le web, un SVG sans taille prend 300 px de large ; sur Android, un %
 * d'élément absolu ignore les marges intérieures du parent.
 */
export function Screentone({ step = 5, dot = 1.4, color = theme.colors.black, style }: ScreentoneProps) {
  // Les identifiants de React contiennent « : », que l'url() du SVG n'accepte pas partout.
  const patternId = `tone-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={patternId} x={0} y={0} width={step} height={step} patternUnits="userSpaceOnUse">
            <Circle cx={step / 2} cy={step / 2} r={dot} fill={color} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}
