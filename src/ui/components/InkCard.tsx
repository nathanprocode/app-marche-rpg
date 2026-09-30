import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../../core/theme";

type InkCardProps = {
  children: ReactNode;
  /** Bordure et fond rouges : état d'alerte (la Marque saigne). */
  alert?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Carte sombre : fond « inkRaised », filet « ash ». */
export function InkCard({ children, alert = false, style }: InkCardProps) {
  return <View style={[styles.card, alert && styles.alert, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
    padding: theme.space[16],
  },
  alert: {
    borderColor: theme.colors.bloodGlow,
    backgroundColor: "rgba(138,3,3,0.22)",
  },
});
