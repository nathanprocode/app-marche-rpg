import { StyleSheet, Switch, Text, View } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { useAuthStore } from "../../store/useAuthStore";
import { useBrandStore } from "../../store/useBrandStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { InkCard } from "../components/InkCard";
import { Screen } from "../components/Screen";

export function ProfileScreen() {
  const status = useBrandStore((state) => state.status);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedCount = usePlayerStore((state) => state.unlockedCheckpoints.length);
  const isPermanentTrackingEnabled = usePlayerStore((state) => state.isPermanentTrackingEnabled);
  const setPermanentTrackingEnabled = usePlayerStore((state) => state.setPermanentTrackingEnabled);
  const userName = useAuthStore((state) => state.userName);
  const logout = useAuthStore((state) => state.logout);

  const previous =
    BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === progress.currentCheckpointId) ?? BERSERK_CHECKPOINTS[0];
  const streakLabel = `${status.streakDays} ${status.streakDays > 1 ? "jours" : "jour"}`;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Profil</Text>
          <Text accessibilityRole="header" style={styles.name}>
            {userName ?? "Le Traqué"}
          </Text>
          <Text style={styles.subtitle}>{`${previous.arc} · point ${unlockedCount} sur ${BERSERK_CHECKPOINTS.length}`}</Text>
        </View>
        <BrandMark visual={status.visual} width={44} />
      </View>

      <View style={styles.stats}>
        <View style={styles.statsRow}>
          <Stat label="Série" value={streakLabel} />
          <Stat label="Pas au total" value={formatInt(progress.totalSteps)} />
        </View>
        <View style={styles.statsRow}>
          <Stat label="Distance" value={`${formatDecimal(progress.totalDistanceKm)} km`} />
          <Stat label="Chroniques" value={`${unlockedCount} / ${BERSERK_CHECKPOINTS.length}`} />
        </View>
      </View>

      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Suivi permanent</Text>
            <Text style={styles.small}>Garde le décompte des pas en arrière-plan grâce à une notification permanente.</Text>
          </View>
          <Switch
            accessibilityLabel="Suivi permanent"
            value={isPermanentTrackingEnabled}
            onValueChange={setPermanentTrackingEnabled}
            thumbColor={theme.colors.bone}
            trackColor={{ false: theme.colors.ash, true: theme.colors.blood }}
          />
        </View>
        <View style={[styles.settingRow, styles.settingRowLast]}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Compte Google</Text>
            <Text style={styles.small}>Ta progression est sauvegardée dans le cloud.</Text>
          </View>
          <Text style={styles.connected}>Connecté</Text>
        </View>
      </View>

      <View style={styles.logout}>
        <Button label="Se déconnecter" variant="danger" onPress={() => void logout()} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <InkCard style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </InkCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.space[16] },
  headerText: { flex: 1 },
  label: { ...theme.text.label, color: theme.colors.boneDim },
  name: { ...theme.text.displayL, color: theme.colors.bone },
  subtitle: { ...theme.text.body, color: theme.colors.boneDim },
  stats: { marginTop: theme.space[24], gap: theme.space[16] },
  statsRow: { flexDirection: "row", gap: theme.space[16] },
  stat: { flex: 1 },
  statValue: { ...theme.text.displayM, color: theme.colors.bone, marginTop: theme.space[4] },
  settings: { marginTop: theme.space[24] },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    paddingVertical: theme.space[16],
    borderTopWidth: 1,
    borderTopColor: theme.colors.ash,
  },
  settingRowLast: { borderBottomWidth: 1, borderBottomColor: theme.colors.ash },
  settingText: { flex: 1 },
  settingTitle: { ...theme.text.bodyStrong, color: theme.colors.bone },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  connected: { ...theme.text.label, color: theme.colors.boneDim },
  logout: { marginTop: theme.space[24] },
});
