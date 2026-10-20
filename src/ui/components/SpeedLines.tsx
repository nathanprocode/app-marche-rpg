import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { theme } from "../../core/theme";

const LINE_COUNT = 72;

/** Rayons fixes (pas d'aléatoire au rendu) : chaque trait part du bord avec sa propre longueur et son épaisseur. */
const RAYS = Array.from({ length: LINE_COUNT }, (_, i) => {
  const angle = (i / LINE_COUNT) * Math.PI * 2;
  // Pseudo-hasard stable : les traits n'ont pas tous la même longueur, comme à la plume.
  const jitter = ((i * 37) % 11) / 11;
  return { angle, reach: 0.55 + jitter * 0.25, width: 0.006 + (((i * 53) % 7) / 7) * 0.012 };
});

type SpeedLinesProps = {
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lignes de concentration (集中線) : des traits qui convergent vers le centre en laissant un vide autour du sujet.
 * Réservées aux grands moments (point franchi), jamais en décor.
 */
export function SpeedLines({ color = theme.colors.toneDark, style }: SpeedLinesProps) {
  return (
    <Svg
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      viewBox="-1 -1 2 2"
      preserveAspectRatio="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {RAYS.map(({ angle, reach, width }, index) => {
        // Chaque trait est un triangle fin : large au bord, pointu vers le centre.
        const outer = 1.5;
        const inner = 1.5 - reach * 1.5;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nx = -sin * width;
        const ny = cos * width;
        const points = [
          `${cos * outer + nx},${sin * outer + ny}`,
          `${cos * outer - nx},${sin * outer - ny}`,
          `${cos * inner},${sin * inner}`,
        ].join(" ");
        return <Polygon key={index} points={points} fill={color} />;
      })}
    </Svg>
  );
}
