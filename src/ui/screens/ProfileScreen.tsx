import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { useBrandStore } from "../../store/useBrandStore";
import { BrandBadge } from "../components/BrandBadge";
import { theme } from "../../core/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { usePedometerStore, type DailyDistanceEntry } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { COMPANIONS, type Companion } from "../../data/companions";

type ProfileTab = "companions" | "stats";

type WeeklyStat = DailyDistanceEntry & {
  label: string;
};

function isCompanionUnlocked(companion: Companion, unlockedCheckpoints: string[]): boolean {
  return companion.unlockCheckpointId === null || unlockedCheckpoints.includes(companion.unlockCheckpointId);
}

function getAdventureDays(userCreatedAtISO: string | null): number {
  if (!userCreatedAtISO) {
    return 1;
  }

  const start = new Date(userCreatedAtISO);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1);
}

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayLabel(date: Date): string {
  const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return labels[date.getDay()];
}

function buildWeeklyStats(dailyHistory: DailyDistanceEntry[]): WeeklyStat[] {
  const byDay = new Map(dailyHistory.map((entry) => [entry.dayKey, entry]));
  const today = new Date();

  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dayKey = getLocalDayKey(date);
    const entry = byDay.get(dayKey);

    return {
      dayKey,
      label: getDayLabel(date),
      steps: entry?.steps ?? 0,
      distanceKm: entry?.distanceKm ?? 0,
      updatedAtISO: entry?.updatedAtISO ?? null,
    };
  });
}

export function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("companions");
  const status = useBrandStore((state) => state.status);
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);
  const dailyHistory = usePedometerStore((state) => state.dailyHistory);
  const unlockedCount = unlockedCheckpoints.length;
  const unlockedCompanionCount = COMPANIONS.filter((companion) =>
    isCompanionUnlocked(companion, unlockedCheckpoints),
  ).length;
  const isPermanentTrackingEnabled = usePlayerStore((state) => state.isPermanentTrackingEnabled);
  const setPermanentTrackingEnabled = usePlayerStore((state) => state.setPermanentTrackingEnabled);
  const userName = useAuthStore((s) => s.userName);
  const userCreatedAtISO = useAuthStore((s) => s.userCreatedAtISO);
  const logout = useAuthStore((s) => s.logout);
  const adventureDays = getAdventureDays(userCreatedAtISO);
  const weeklyStats = useMemo(() => buildWeeklyStats(dailyHistory), [dailyHistory]);
  const maxDailyKm = Math.max(0.01, ...weeklyStats.map((entry) => entry.distanceKm));
  const totalWeekKm = weeklyStats.reduce((sum, entry) => sum + entry.distanceKm, 0);
  const bestDay = weeklyStats.reduce((best, entry) => (entry.distanceKm > best.distanceKm ? entry : best), weeklyStats[0]);

  return (
    <Screen scroll>
      <Text style={styles.title}>Profil du Traqué</Text>
      <Text style={styles.meta}>Traqué: {userName ?? "Inconnu"}</Text>
      <Text style={styles.meta}>Jours depuis le commencement de l'aventure: {adventureDays}</Text>
      <Text style={styles.meta}>Souvenirs débloqués: {unlockedCount}</Text>
      <BrandBadge visual={status.visual} />

      <Pressable style={styles.galleryButton} onPress={() => router.push("/gallery")}>
        <Text style={styles.galleryButtonText}>Galerie des Souvenirs</Text>
      </Pressable>

      <View style={styles.profileTabs}>
        <Pressable
          style={[styles.profileTab, activeTab === "companions" && styles.profileTabActive]}
          onPress={() => setActiveTab("companions")}
        >
          <Text style={[styles.profileTabText, activeTab === "companions" && styles.profileTabTextActive]}>
            Compagnons
          </Text>
        </Pressable>
        <Pressable
          style={[styles.profileTab, activeTab === "stats" && styles.profileTabActive]}
          onPress={() => setActiveTab("stats")}
        >
          <Text style={[styles.profileTabText, activeTab === "stats" && styles.profileTabTextActive]}>
            Statistiques
          </Text>
        </Pressable>
      </View>

      {activeTab === "stats" ? (
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <Text style={styles.sectionCount}>7 jours</Text>
          </View>

          <View style={styles.statsPanel}>
            <View style={styles.statsSummaryRow}>
              <View>
                <Text style={styles.statSummaryLabel}>Total semaine</Text>
                <Text style={styles.statSummaryValue}>{totalWeekKm.toFixed(2)} km</Text>
              </View>
              <View style={styles.bestDayBox}>
                <Text style={styles.statSummaryLabel}>Meilleur jour</Text>
                <Text style={styles.bestDayValue}>
                  {bestDay.distanceKm > 0 ? `${bestDay.label} - ${bestDay.distanceKm.toFixed(2)} km` : "Aucun"}
                </Text>
              </View>
            </View>

            <View style={styles.chart}>
              {weeklyStats.map((entry) => {
                const barHeight = Math.max(4, Math.round((entry.distanceKm / maxDailyKm) * 118));
                const isBestDay = entry.dayKey === bestDay.dayKey && entry.distanceKm > 0;

                return (
                  <View key={entry.dayKey} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{entry.distanceKm > 0 ? entry.distanceKm.toFixed(1) : ""}</Text>
                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          isBestDay && styles.chartBarBest,
                          { height: barHeight },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{entry.label}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.chartHint}>Le graphique se remplit avec tes kilometres quotidiens sur ce telephone.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.companionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes compagnons</Text>
            <Text style={styles.sectionCount}>
              {unlockedCompanionCount}/{COMPANIONS.length}
            </Text>
          </View>

          <View style={styles.companionGrid}>
            {COMPANIONS.map((companion) => {
              const isUnlocked = isCompanionUnlocked(companion, unlockedCheckpoints);

              return (
                <View key={companion.id} style={[styles.companionCard, !isUnlocked && styles.companionCardLocked]}>
                  <View style={styles.companionPortrait}>
                    {isUnlocked ? (
                      <Image source={companion.image} style={styles.companionImage} resizeMode="contain" />
                    ) : (
                      <Ionicons name="lock-closed" size={28} color={theme.colors.text.muted} />
                    )}
                  </View>
                  <View style={styles.companionCopy}>
                    <Text style={styles.companionName}>{isUnlocked ? companion.name : "???"}</Text>
                    <Text style={styles.companionRole}>{isUnlocked ? companion.title : "Compagnon verrouille"}</Text>
                    <Text style={styles.companionDescription}>{isUnlocked ? companion.description : "???"}</Text>
                    <Text style={styles.unlockLabel}>{companion.unlockLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>Suivi permanent</Text>
          <Text style={styles.settingDesc}>Garde la marche active et la notification visible.</Text>
        </View>
        <Switch
          value={isPermanentTrackingEnabled}
          onValueChange={setPermanentTrackingEnabled}
          thumbColor={isPermanentTrackingEnabled ? theme.colors.blood.glow : theme.colors.metal}
          trackColor={{ false: "#2A2D34", true: "rgba(193,18,31,0.42)" }}
        />
      </View>

      <Text style={styles.logout} onPress={logout}>
        Se déconnecter
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.extraBold,
    marginBottom: theme.spacing.sm,
  },
  meta: { color: theme.colors.text.muted, marginBottom: theme.spacing.xs },
  profileTabs: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  profileTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "rgba(10,10,12,0.72)",
    padding: theme.spacing.sm,
  },
  profileTabActive: {
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(139,0,0,0.24)",
  },
  profileTabText: {
    color: theme.colors.text.muted,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
    textAlign: "center",
  },
  profileTabTextActive: {
    color: theme.colors.text.primary,
  },
  statsSection: {
    marginTop: theme.spacing.lg,
  },
  statsPanel: {
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.spacing.md,
  },
  statsSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  statSummaryLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    textTransform: "uppercase",
  },
  statSummaryValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
    marginTop: theme.spacing.xs,
  },
  bestDayBox: {
    flex: 1,
    alignItems: "flex-end",
  },
  bestDayValue: {
    color: theme.colors.blood.glow,
    fontWeight: "800",
    marginTop: theme.spacing.xs,
    textAlign: "right",
  },
  chart: {
    height: 172,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartValue: {
    height: 18,
    color: theme.colors.text.muted,
    fontSize: 10,
    marginBottom: theme.spacing.xs,
  },
  chartTrack: {
    width: "100%",
    height: 120,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(94,100,114,0.42)",
    backgroundColor: "#000000",
  },
  chartBar: {
    width: "100%",
    backgroundColor: "#8B0000",
  },
  chartBarBest: {
    backgroundColor: theme.colors.blood.glow,
    shadowColor: theme.colors.blood.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
    elevation: 5,
  },
  chartLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
  },
  chartHint: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.md,
  },
  companionsSection: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extraBold,
  },
  sectionCount: {
    color: theme.colors.blood.glow,
    fontWeight: "800",
  },
  companionGrid: {
    gap: theme.spacing.sm,
  },
  companionCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.spacing.md,
  },
  companionCardLocked: {
    borderColor: "#2A2D34",
    backgroundColor: "rgba(10,10,12,0.72)",
  },
  companionPortrait: {
    width: 64,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: "#08080A",
  },
  companionImage: {
    width: 58,
    height: 64,
  },
  companionCopy: {
    flex: 1,
  },
  companionName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
  },
  companionRole: {
    color: theme.colors.blood.glow,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
  },
  companionDescription: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  unlockLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.sm,
  },
  settingRow: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.weight.extraBold,
  },
  settingDesc: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
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
