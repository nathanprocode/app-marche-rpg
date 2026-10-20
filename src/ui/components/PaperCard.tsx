import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../../core/theme";

type PaperCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Case cadrée à marges fines : les planches du manga s'y posent en pleine largeur. */
export function PaperCard({ children, style }: PaperCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.paper,
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
    padding: theme.space[8],
    overflow: "hidden",
  },
});
