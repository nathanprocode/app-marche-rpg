import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../../core/theme";

type InkCardProps = {
  children: ReactNode;
  /** Cadre rouge : état d'alerte (la Marque saigne). */
  alert?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Lue d'un seul tenant par TalkBack, avec ce libellé. */
  accessible?: boolean;
  accessibilityLabel?: string;
};

/** Case cadrée, pour une case posée sur du papier (hors planche noire). */
export function InkCard({ children, alert = false, style, accessible, accessibilityLabel }: InkCardProps) {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, alert && styles.alert, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.paper,
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
    padding: theme.space[16],
  },
  alert: { borderColor: theme.colors.red },
});
