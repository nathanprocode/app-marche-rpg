import { useId } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, Path, Pattern } from "react-native-svg";
import { theme } from "../../core/theme";
import { BRAND_MARK_LOWER_PATH, BRAND_MARK_MAIN_PATH, MARK_RATIO } from "./BrandMark";

type BrandWatermarkProps = {
  /** Largeur en px ; la hauteur suit les proportions du symbole. */
  width: number;
  /** Couleur des points de la trame. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * La Marque du Sacrifice en filigrane : le symbole rempli d'une trame de points, sans contour.
 * Décor de fond d'une case noire, à poser en position absolue et à laisser couper par le bord.
 */
export function BrandWatermark({ width, color = theme.colors.toneDark, style }: BrandWatermarkProps) {
  const patternId = `brand-tone-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // La trame est dessinée dans les unités du symbole (176 × 300) : des points fins et espacés à l'écran, pour que le
  // texte posé dessus reste lisible.
  const unitsPerPx = 176 / width;
  const step = 5 * unitsPerPx;

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={Math.round(width * MARK_RATIO)}
      viewBox="0 0 176 300"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <Pattern id={patternId} x={0} y={0} width={step} height={step} patternUnits="userSpaceOnUse">
          <Circle cx={step / 2} cy={step / 2} r={1 * unitsPerPx} fill={color} />
        </Pattern>
      </Defs>
      <G fill={`url(#${patternId})`}>
        <Path d={BRAND_MARK_MAIN_PATH} />
        <Path d={BRAND_MARK_LOWER_PATH} />
      </G>
    </Svg>
  );
}
