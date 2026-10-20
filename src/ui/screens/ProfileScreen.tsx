import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { DAILY_GOAL_OPTIONS } from "../../core/constants/game";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { GUTS_SKINS } from "../../data/gutsSkins";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { historySpanDays, lastDays, summarizeDays } from "../../features/history/weekHistory";
import { vibrate } from "../../features/haptics/haptics";
import { isGoalReached } from "../../features/progression/selectors";
import { REMINDER_HOUR_OPTIONS } from "../../features/reminders/eveningReminder";
import { requestReminderPermission } from "../../features/reminders/reminderScheduler";
import { resolveGutsSkin, unlockedSkins } from "../../features/skins/gutsSkin";
import { eraseAllProgress } from "../../features/runtime/eraseProgress";
import { buildProgressCard } from "../../features/share/shareCards";
import { useShareStore } from "../../store/useShareStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { flushCloudSave, usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { AppearancePicker } from "../components/AppearancePicker";
import { ChoiceRow } from "../components/ChoiceRow";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { WeekChart } from "../components/WeekChart";

/** Interrupteur Material, encré : piste noire quand il est activé. */
const SWITCH_COLORS = {
  thumbColor: theme.colors.paper,
  trackColor: { false: theme.colors.tone, true: theme.colors.black },
} as const;

export function ProfileScreen() {
  const status = useBrandStore((state) => state.status);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedCount = usePlayerStore((state) => state.unlockedCheckpoints.length);
  const isPermanentTrackingEnabled = usePlayerStore((state) => state.isPermanentTrackingEnabled);
  const setPermanentTrackingEnabled = usePlayerStore((state) => state.setPermanentTrackingEnabled);
  const userName = useAuthStore((state) => state.userName);
  const logout = useAuthStore((state) => state.logout);
  const history = usePedometerStore((state) => state.history);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const startNextLap = usePlayerStore((state) => state.startNextLap);
  const dailyGoal = useSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useSettingsStore((state) => state.setDailyGoal);
  const reminderEnabled = useSettingsStore((state) => state.eveningReminderEnabled);
  const reminderHour = useSettingsStore((state) => state.eveningReminderHour);
  const setReminderEnabled = useSettingsStore((state) => state.setEveningReminderEnabled);
  const setReminderHour = useSettingsStore((state) => state.setEveningReminderHour);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const gutsSkinId = useSettingsStore((state) => state.gutsSkinId);
  const setGutsSkinId = useSettingsStore((state) => state.setGutsSkinId);
  const [reminderDenied, setReminderDenied] = useState(false);
  const requestShare = useShareStore((state) => state.requestShare);
  const [period, setPeriod] = useState<HistoryPeriod>("week");

  async function handleReminderToggle(enabled: boolean): Promise<void> {
    if (enabled && !(await requestReminderPermission())) {
      setReminderDenied(true);
      return;
    }
    setReminderDenied(false);
    setReminderEnabled(enabled);
  }

  const previous =
    BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === progress.currentCheckpointId) ?? BERSERK_CHECKPOINTS[0];
  const streakLabel = `${status.streakDays} ${status.streakDays > 1 ? "jours" : "jour"}`;
  const now = new Date();
  const days = lastDays(history, now, period === "week" ? 7 : period === "month" ? 30 : historySpanDays(history, now));
  const summary = summarizeDays(days, dailyGoal);
  const daysWithSteps = days.filter((day) => day.steps > 0).length;
  const showChart = period !== "all";

  function confirmErase(): void {
    Alert.alert(
      "Recommencer à zéro ?",
      "Ta progression, ta série, tes succès, tes chroniques et ton historique seront effacés, sur ce téléphone et dans le cloud. Tes réglages sont conservés. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Tout effacer", style: "destructive", onPress: () => void eraseAllProgress() },
      ],
    );
  }

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
      </Panel>

      <View style={styles.statsRow}>
        <Stat label="de série" value={streakLabel} />
        <Stat label="meilleure série" value={`${bestStreak} ${bestStreak > 1 ? "jours" : "jour"}`} />
      </View>
      <View style={styles.statsRow}>
        <Stat label="pas au total" value={formatInt(progress.totalSteps)} />
        <Stat label="distance du tour" value={`${formatDecimal(progress.totalDistanceKm)} km`} />
      </View>
      <View style={styles.statsRow}>
        <Stat label="chroniques" value={`${unlockedCount} / ${BERSERK_CHECKPOINTS.length}`} />
        <Stat label="tour de Traque" value={`${progress.lap}`} />
      </View>

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
          <WeekFigure label="Marque apaisée" value={`${summary.calmDays} / ${days.length} j`} />
        </View>
        {showChart ? <WeekChart key={period} days={days} thresholdSteps={dailyGoal} /> : null}
        {daysWithSteps < 2 ? <Text style={styles.small}>L'historique se remplit jour après jour sur ce téléphone.</Text> : null}
      </Panel>

      {isGoalReached(progress) ? (
        <Panel reversed>
          <Button label={`Commencer le tour ${progress.lap + 1}`} variant="secondary" onPress={() => void startNextLap()} />
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

      <Panel>
        <Text accessibilityRole="header" style={styles.heading}>
          Réglages
        </Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingTitle}>Objectif quotidien</Text>
          <Text style={styles.small}>Les pas à faire chaque jour pour apaiser la Marque et garder ta série.</Text>
          <ChoiceRow
            options={DAILY_GOAL_OPTIONS.map((steps) => ({ value: steps, label: formatInt(steps) }))}
            selected={dailyGoal}
            onSelect={setDailyGoal}
            accessibilityPrefix="Objectif quotidien en pas"
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Rappel du soir</Text>
            <Text style={[styles.small, reminderDenied && styles.warning]}>
              {reminderDenied
                ? "Notifications refusées : autorise-les dans les réglages du téléphone."
                : "Une notification si tu n'as pas atteint ton objectif."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Rappel du soir"
            value={reminderEnabled}
            onValueChange={(enabled) => void handleReminderToggle(enabled)}
            {...SWITCH_COLORS}
          />
        </View>
        {reminderEnabled ? (
          <View style={styles.settingBlockNoRule}>
            <ChoiceRow
              options={REMINDER_HOUR_OPTIONS.map((hour) => ({ value: hour, label: `${hour} h` }))}
              selected={reminderHour}
              onSelect={setReminderHour}
              accessibilityPrefix="Heure du rappel"
            />
          </View>
        ) : null}
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Vibrations</Text>
            <Text style={styles.small}>Une vibration brève à chaque point franchi, succès ou objectif du jour atteint.</Text>
          </View>
          <Switch
            accessibilityLabel="Vibrations"
            value={hapticsEnabled}
            onValueChange={(enabled) => {
              setHapticsEnabled(enabled);
              // On sent tout de suite ce que fait l'option.
              if (enabled) vibrate("achievement");
            }}
            {...SWITCH_COLORS}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Suivi permanent</Text>
            <Text style={styles.small}>Garde le décompte des pas en arrière-plan grâce à une notification permanente.</Text>
          </View>
          <Switch
            accessibilityLabel="Suivi permanent"
            value={isPermanentTrackingEnabled}
            onValueChange={setPermanentTrackingEnabled}
            {...SWITCH_COLORS}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Compte Google</Text>
            <Text style={styles.small}>Ta progression est sauvegardée dans le cloud.</Text>
          </View>
          <Text style={styles.connected}>Connecté</Text>
        </View>
      </Panel>

      <Panel style={styles.section}>
        <Button
          label="Partager ma progression"
          variant="secondary"
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
        <Button
          label="Se déconnecter"
          variant="danger"
          onPress={() => {
            // La sauvegarde cloud en attente part avant la déconnexion (le local, lui, est déjà à jour).
            flushCloudSave();
            void logout();
          }}
        />
      </Panel>

      <Panel reversed style={styles.section}>
        <Text style={styles.smallOnBlack}>Efface ta progression, tes succès et ton historique, ici et dans le cloud.</Text>
        <Button label="Recommencer à zéro" variant="danger" onPress={confirmErase} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel reversed style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text {...theme.fitDisplayText} style={styles.statValue}>
        {value}
      </Text>
      <Text style={styles.smallOnBlack}>{label}</Text>
    </Panel>
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
  statsRow: { flexDirection: "row", gap: theme.gutter },
  stat: { flex: 1, gap: 2 },
  statValue: { ...theme.text.displayM, color: theme.colors.paper },
  section: { gap: theme.space[16] },
  heading: { ...theme.text.displayM, color: theme.colors.black },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  warning: { color: theme.colors.red },
  weekSummary: { flexDirection: "row", gap: theme.space[16] },
  weekFigure: { flex: 1, gap: 2 },
  weekValue: { ...theme.text.displayS, color: theme.colors.black },
  settingBlock: { gap: theme.space[8], paddingVertical: theme.space[16] },
  settingBlockNoRule: { paddingBottom: theme.space[16] },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    paddingVertical: theme.space[16],
    borderTopWidth: 1,
    borderTopColor: theme.colors.black,
  },
  settingText: { flex: 1, gap: 2 },
  settingTitle: { ...theme.text.bodyStrong, color: theme.colors.black },
  connected: { ...theme.text.bodyStrong, color: theme.colors.black },
});
