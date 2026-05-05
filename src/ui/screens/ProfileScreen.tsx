import { StyleSheet, Text } from "react-native";
import { Screen } from "../components/Screen";
import { useBrandStore } from "../../store/useBrandStore";
import { BrandBadge } from "../components/BrandBadge";
import { theme } from "../../core/theme";
import { useAuthStore } from "../../store/useAuthStore";

export function ProfileScreen() {
  const status = useBrandStore((state) => state.status);
  const userName = useAuthStore((s) => s.userName);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Text style={styles.title}>Profil du Traqué</Text>
      <Text style={styles.meta}>Traqué: {userName ?? "Inconnu"}</Text>
      <Text style={styles.meta}>Série: {status.streakDays} jours</Text>
      <Text style={styles.meta}>Jours sédentaires: {status.sedentaryDays}</Text>
      <BrandBadge visual={status.visual} />
      <Text style={styles.logout} onPress={logout}>Se déconnecter</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xl, marginBottom: theme.spacing.sm },
  meta: { color: theme.colors.text.muted, marginBottom: theme.spacing.xs },
  logout: { color: theme.colors.blood.glow, marginTop: theme.spacing.lg, fontWeight: "700" },
});
