import { StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

type ProgressBarProps = {
  /** Avancement de 0 à 100. */
  pct: number;
  /** @deprecated Sans effet : toutes les barres sont posées sur du papier. */
  onPaper?: boolean;
  /** Remplissage noir (Marque apaisée, trajet) ; sinon rouge (la Marque saigne). */
  calm?: boolean;
  /** Barre posée dans une case inversée (fond noir). */
  reversed?: boolean;
  /** Hauteur du remplissage, sans le cadre. */
  height?: number;
  /** Ce que mesure la barre, lu par TalkBack avant le pourcentage (« Seuil de pas du jour, 30 % »). */
  accessibilityLabel?: string;
};

/** Barre encrée : un cadre noir, un remplissage plein. */
export function ProgressBar({
  pct,
  onPaper = false,
  calm = false,
  reversed = false,
  height = 8,
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const isCalm = calm || onPaper;
  const fillColor = reversed
    ? isCalm
      ? theme.colors.paper
      : theme.colors.redOnBlack
    : isCalm
      ? theme.colors.black
      : theme.colors.red;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.track, reversed && styles.trackReversed, { height: height + theme.frame * 2 }]}
    >
      <View style={{ width: `${clamped}%`, height, backgroundColor: fillColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.paper,
  },
  trackReversed: { borderColor: theme.colors.paper, backgroundColor: theme.colors.black },
});
