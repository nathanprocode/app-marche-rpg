import { useId } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
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

/** Trame de points, comme celles collées sur les planches. Remplit son parent (position absolue par défaut). */
export function Screentone({ step = 5, dot = 1.4, color = theme.colors.black, style }: ScreentoneProps) {
  // Les identifiants de React contiennent « : », que l'url() du SVG n'accepte pas partout.
  const patternId = `tone-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <Pattern id={patternId} x={0} y={0} width={step} height={step} patternUnits="userSpaceOnUse">
          <Circle cx={step / 2} cy={step / 2} r={dot} fill={color} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}
