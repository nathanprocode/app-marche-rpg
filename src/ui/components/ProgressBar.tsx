import { StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

type ProgressBarProps = {
  /** Avancement de 0 à 100. */
  pct: number;
  /** Piste claire, pour une barre posée sur une carte papier. */
  onPaper?: boolean;
  /** Remplissage neutre (Marque apaisée) au lieu du rouge. */
  calm?: boolean;
  height?: number;
};

export function ProgressBar({ pct, onPaper = false, calm = false, height = 4 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fillColor = calm ? theme.colors.boneDim : onPaper ? theme.colors.blood : theme.colors.bloodGlow;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.track, { height }, onPaper ? styles.trackPaper : styles.trackInk]}
    >
      <View style={{ width: `${clamped}%`, height, backgroundColor: fillColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", overflow: "hidden" },
  trackInk: { backgroundColor: theme.colors.ash },
  trackPaper: { backgroundColor: "rgba(12,10,9,0.16)" },
});
