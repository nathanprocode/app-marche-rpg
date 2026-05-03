import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

export function SteelCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.secondary,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
});
