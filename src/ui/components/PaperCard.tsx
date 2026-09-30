import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../../core/theme";

type PaperCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Carte « papier » (bone) : les planches du manga s'y fondent en mode multiply. */
export function PaperCard({ children, style }: PaperCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bone,
    borderWidth: 1,
    borderColor: "rgba(12,10,9,0.55)",
    borderRadius: theme.radius[4],
    padding: theme.space[8],
    overflow: "hidden",
  },
});
