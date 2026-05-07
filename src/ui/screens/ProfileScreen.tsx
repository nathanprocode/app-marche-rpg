import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { Screen } from "../components/Screen";
import { useBrandStore } from "../../store/useBrandStore";
import { BrandBadge } from "../components/BrandBadge";
import { theme } from "../../core/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { usePlayerStore } from "../../store/usePlayerStore";

export function ProfileScreen() {
  const router = useRouter();
  const status = useBrandStore((state) => state.status);
  const unlockedCount = usePlayerStore((state) => state.unlockedCheckpoints.length);
  const userName = useAuthStore((s) => s.userName);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Text style={styles.title}>Profil du Traqué</Text>
      <Text style={styles.meta}>Traqué: {userName ?? "Inconnu"}</Text>
      <Text style={styles.meta}>Série: {status.streakDays} jours</Text>
      <Text style={styles.meta}>Jours sédentaires: {status.sedentaryDays}</Text>
      <Text style={styles.meta}>Souvenirs débloqués: {unlockedCount}</Text>
      <BrandBadge visual={status.visual} />

      <Pressable style={styles.galleryButton} onPress={() => router.push("/gallery")}>
        <Text style={styles.galleryButtonText}>Galerie des Souvenirs</Text>
      </Pressable>

      <Text style={styles.logout} onPress={logout}>
        Se déconnecter
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xl, marginBottom: theme.spacing.sm },
  meta: { color: theme.colors.text.muted, marginBottom: theme.spacing.xs },
  galleryButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(138,3,3,0.18)",
    padding: theme.spacing.md,
  },
  galleryButtonText: {
    color: theme.colors.text.primary,
    textAlign: "center",
    fontWeight: "700",
  },
  logout: { color: theme.colors.blood.glow, marginTop: theme.spacing.lg, fontWeight: "700" },
});
