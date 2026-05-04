import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";
import type { BrandVisualState } from "../../features/brandOfSacrifice/types";

export function BrandBadge({ visual }: { visual: BrandVisualState }) {
  const bleeding = visual.state === "bleeding";

  return (
    <View style={[styles.badge, bleeding && styles.bleeding]}>
      <Text style={styles.title}>Marque du Sacrifice</Text>
      <Text style={styles.meta}>État: {visual.state}</Text>
      <Text style={styles.meta}>Intensité: {(visual.intensity * 100).toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.bg.secondary,
    borderColor: theme.colors.metal,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  bleeding: {
    borderColor: theme.colors.blood.glow,
    shadowColor: theme.colors.blood.glow,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.lg },
  meta: { color: theme.colors.text.muted, marginTop: theme.spacing.xs },
});
