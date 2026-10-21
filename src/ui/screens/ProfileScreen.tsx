import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { GUTS_SKINS } from "../../data/gutsSkins";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { historySpanDays, lastDays, summarizeDays } from "../../features/history/weekHistory";
import { isGoalReached } from "../../features/progression/selectors";
import { resolveGutsSkin, unlockedSkins } from "../../features/skins/gutsSkin";
import { buildProgressCard } from "../../features/share/shareCards";
import { useShareStore } from "../../store/useShareStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { AppearancePicker } from "../components/AppearancePicker";
import { ChoiceRow } from "../components/ChoiceRow";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { WeekChart } from "../components/WeekChart";

/** Profil : qui tu es dans le tome, ta série, ton historique et ton apparence. Les réglages sont derrière l'engrenage. */
export function ProfileScreen() {
  const router = useRouter();
  const status = useBrandStore((state) => state.status);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedCount = usePlayerStore((state) => state.unlockedCheckpoints.length);
  const userName = useAuthStore((state) => state.userName);
  const history = usePedometerStore((state) => state.history);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const startNextLap = usePlayerStore((state) => state.startNextLap);
  const dailyGoal = useSettingsStore((state) => state.dailyGoal);
  const gutsSkinId = useSettingsStore((state) => state.gutsSkinId);
  const setGutsSkinId = useSettingsStore((state) => state.setGutsSkinId);
  const requestShare = useShareStore((state) => state.requestShare);
  const [period, setPeriod] = useState<HistoryPeriod>("week");

  const previous =
    BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === progress.currentCheckpointId) ?? BERSERK_CHECKPOINTS[0];
  const streakLabel = `${status.streakDays} ${status.streakDays > 1 ? "jours" : "jour"}`;
  const now = new Date();
  const days = lastDays(history, now, period === "week" ? 7 : period === "month" ? 30 : historySpanDays(history, now));
  const summary = summarizeDays(days, dailyGoal);
  const daysWithSteps = days.filter((day) => day.steps > 0).length;
  const daysWithoutData = days.filter((day) => !day.recorded).length;
  const showChart = period !== "all";

  return (
    <Screen scroll variant="page">
      <Panel reversed style={styles.header}>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={styles.name}>
            {userName ?? "Le Traqué"}
          </Text>
          <Text style={styles.subtitle}>{`${previous.arc} · point ${unlockedCount} sur ${BERSERK_CHECKPOINTS.length}${progress.lap > 1 ? ` · tour ${progress.lap}` : ""}`}</Text>
        </View>
        <BrandMark visual={status.visual} width={40} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réglages"
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.paper} />
        </Pressable>
      </Panel>

      {/* La distance en grand est sur l'accueil : ici, la série et le total, puis de quoi les partager. */}
      <Panel reversed style={styles.section}>
        <View>
          <StatRow label="Série" value={streakLabel} />
          <StatRow label="Meilleure série" value={`${bestStreak} ${bestStreak > 1 ? "jours" : "jour"}`} />
          <StatRow label="Pas depuis le début" value={formatInt(progress.totalSteps)} last />
        </View>
        <Button
          label="Partager ma progression"
          variant="secondary"
          onDark
          onPress={() =>
            requestShare(
              buildProgressCard({
                totalKm: progress.totalDistanceKm,
                lap: progress.lap,
                streakDays: status.streakDays,
                bestStreak,
                totalSteps: progress.totalSteps,
                arc: previous.arc,
              }),
            )
          }
        />
      </Panel>

      <Panel style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          Historique
        </Text>
        <ChoiceRow options={HISTORY_PERIODS} selected={period} onSelect={setPeriod} accessibilityPrefix="Période de l'historique" />
        <View style={styles.weekSummary}>
          <WeekFigure label={PERIOD_TOTAL_LABEL[period]} value={`${formatDecimal(summary.totalKm)} km`} />
          <WeekFigure
            label="record"
            value={summary.bestDay ? `${formatDecimal(summary.bestDay.km)} km` : "—"}
            hint={summary.bestDay ? (summary.bestDay.isToday ? "aujourd'hui" : `${summary.bestDay.weekday} ${summary.bestDay.dayOfMonth}`) : undefined}
          />
          {/* Sur les seuls jours connus : un jour absent de l'historique du téléphone n'est pas un jour manqué. */}
          <WeekFigure
            label="Marque apaisée"
            value={summary.knownDays > 0 ? `${summary.calmDays} / ${summary.knownDays} j` : "—"}
            hint={daysWithoutData > 0 ? `${daysWithoutData} j sans données` : undefined}
          />
        </View>
        {showChart ? <WeekChart key={period} days={days} thresholdSteps={dailyGoal} /> : null}
        {daysWithSteps < 2 ? <Text style={styles.small}>L'historique se remplit jour après jour sur ce téléphone.</Text> : null}
      </Panel>

      {isGoalReached(progress) ? (
        <Panel reversed>
          <Button label={`Commencer le tour ${progress.lap + 1}`} onDark onPress={() => void startNextLap()} />
        </Panel>
      ) : null}

      <Panel style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          Apparence
        </Text>
        <AppearancePicker
          skins={GUTS_SKINS}
          unlockedIds={unlockedSkins(GUTS_SKINS, progress, BERSERK_CHECKPOINTS).map((skin) => skin.id)}
          selectedId={resolveGutsSkin(GUTS_SKINS, gutsSkinId, progress, BERSERK_CHECKPOINTS).id}
          onSelect={setGutsSkinId}
        />
      </Panel>
    </Screen>
  );
}

type HistoryPeriod = "week" | "month" | "all";

const HISTORY_PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: "week", label: "7 jours" },
  { value: "month", label: "30 jours" },
  { value: "all", label: "Tout" },
];

const PERIOD_TOTAL_LABEL: Record<HistoryPeriod, string> = { week: "cette semaine", month: "ce mois", all: "au total" };

function StatRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowRule]} accessible accessibilityLabel={`${label} : ${value}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text {...theme.fitDisplayText} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function WeekFigure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.weekFigure} accessible accessibilityLabel={`${value} ${label}${hint ? `, ${hint}` : ""}`}>
      <Text {...theme.fitDisplayText} style={styles.weekValue}>
        {value}
      </Text>
      <Text style={styles.small}>{hint ? `${label}, ${hint}` : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space[16] },
  headerText: { flex: 1, gap: theme.space[4] },
  name: { ...theme.text.displayL, color: theme.colors.paper },
  subtitle: { ...theme.text.body, color: theme.colors.paperSoft },
  settingsButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
    borderColor: theme.colors.paper,
  },
  settingsButtonPressed: { backgroundColor: theme.colors.blackSoft },
  statRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: theme.space[16], paddingVertical: theme.space[8] },
  statRowRule: { borderBottomWidth: 1, borderBottomColor: theme.colors.toneDark },
  statLabel: { ...theme.text.body, color: theme.colors.paperSoft, flexShrink: 1 },
  statValue: { ...theme.text.displayM, color: theme.colors.paper },
  section: { gap: theme.space[16] },
  heading: { ...theme.text.displayM, color: theme.colors.black },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  weekSummary: { flexDirection: "row", gap: theme.space[16] },
  weekFigure: { flex: 1, gap: 2 },
  weekValue: { ...theme.text.displayS, color: theme.colors.black },
});
