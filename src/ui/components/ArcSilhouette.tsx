import { useId } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, Path, Pattern } from "react-native-svg";
import { theme } from "../../core/theme";

/** Silhouettes dessinées dans un repère 40 × 200 (objet debout), remplies d'une trame de points. */
const VIEW_WIDTH = 40;
const VIEW_HEIGHT = 200;

const SILHOUETTES = {
  // La Dragonslayer : une lame trop grande, pointe biseautée, garde droite.
  dragonslayer:
    "M8 14 L22 0 L32 8 L32 140 L8 140 Z M0 140 L40 140 L40 149 L0 149 Z M16 149 L24 149 L24 188 L16 188 Z M12 188 L28 188 L28 198 L12 198 Z",
  // Le sabre de Griffith : une lame fine et courbe, petite garde en croissant.
  sabre:
    "M21 0 Q34 70 25 143 L18 143 Q27 70 21 0 Z M8 146 Q21 140 34 146 L34 151 Q21 146 8 151 Z M18 151 L24 151 L23 190 L19 190 Z M17 190 L25 190 L24 197 L18 197 Z",
  // Le béhélit : un œuf au visage de travers (yeux, nez et bouche évidés).
  behelit:
    "M20 40 C34 40 40 70 40 104 C40 140 32 160 20 160 C8 160 0 140 0 104 C0 70 6 40 20 40 Z M9 82 C11 79 16 79 17 83 C15 86 11 86 9 82 Z M24 90 C26 86 31 86 32 89 C30 93 26 93 24 90 Z M18 100 L21 100 L22 114 L17 114 Z M8 128 C14 124 24 125 31 120 C29 127 18 131 8 128 Z",
  // Une aile du Faucon : des pennes qui s'effilent vers le bas.
  wing:
    "M4 0 C26 10 40 40 38 80 L30 74 L34 104 L24 94 L27 128 L17 114 L18 152 L10 132 L8 176 L3 140 C-2 100 0 40 4 0 Z",
} as const;

export type SilhouetteName = keyof typeof SILHOUETTES;

/** L'objet qui illustre chaque arc de la Traque. */
const ARC_SILHOUETTE: Record<string, SilhouetteName> = {
  "Guerrier Noir": "dragonslayer",
  "Âge d'Or": "sabre",
  "Châtiments": "behelit",
  "Faucon Millénaire": "wing",
  "Fantasia": "dragonslayer",
};

export function silhouetteForArc(arc: string): SilhouetteName {
  return ARC_SILHOUETTE[arc] ?? "dragonslayer";
}

type ArcSilhouetteProps = {
  name: SilhouetteName;
  /** Hauteur en px ; la largeur suit le repère 40 × 200. */
  height: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Silhouette d'un objet de Berserk en trame de points, à poser en décor dans le coin d'une case claire et à
 * laisser couper par le bord. La trame (et non un aplat noir) garde le texte posé dessus lisible.
 */
export function ArcSilhouette({ name, height, color = theme.colors.tone, style }: ArcSilhouetteProps) {
  const patternId = `silhouette-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Trame de pas 4 px et de points de 1,1 px à l'écran, quelle que soit la taille de la silhouette.
  const unitsPerPx = VIEW_HEIGHT / height;
  const step = 4 * unitsPerPx;

  return (
    <Svg
      pointerEvents="none"
      width={(height * VIEW_WIDTH) / VIEW_HEIGHT}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <Pattern id={patternId} x={0} y={0} width={step} height={step} patternUnits="userSpaceOnUse">
          <Circle cx={step / 2} cy={step / 2} r={1.1 * unitsPerPx} fill={color} />
        </Pattern>
      </Defs>
      <Path d={SILHOUETTES[name]} fill={`url(#${patternId})`} fillRule="evenodd" />
    </Svg>
  );
}
