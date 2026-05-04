import { StyleSheet, Text } from "react-native";
import { Screen } from "../components/Screen";
import { useBrandStore } from "../../store/useBrandStore";
import { BrandBadge } from "../components/BrandBadge";
import { theme } from "../../core/theme";

export function ProfileScreen() {
  const status = useBrandStore((state) => state.status);

  return (
    <Screen>
      <Text style={styles.title}>Profil du Traqué</Text>
      <Text style={styles.meta}>Série: {status.streakDays} jours</Text>
      <Text style={styles.meta}>Jours sédentaires: {status.sedentaryDays}</Text>
      <BrandBadge visual={status.visual} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xl, marginBottom: theme.spacing.sm },
  meta: { color: theme.colors.text.muted, marginBottom: theme.spacing.xs },
});
