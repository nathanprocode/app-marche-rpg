import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { theme } from "../../core/theme";

/** Écart entre deux hachures, en px. */
const HATCH_STEP = 5;

/**
 * Hachures en biais sur la page noire, comme le fond encré d'une planche : on les devine dans les gouttières
 * entre les cases. Remplit son parent (position absolue), derrière le contenu.
 */
export function PageHatching() {
  const patternId = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <Pattern
          id={patternId}
          x={0}
          y={0}
          width={HATCH_STEP}
          height={HATCH_STEP}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Line x1={0} y1={0} x2={0} y2={HATCH_STEP} stroke={theme.colors.toneDark} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}
