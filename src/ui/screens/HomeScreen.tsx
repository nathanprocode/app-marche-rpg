import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { BOSS_ENCOUNTERS } from "../../data/bosses";
import { computeDuels } from "../../features/bosses/duel";
import { resolveCampScene } from "../../features/camp/campScene";
import { lastDays } from "../../features/history/weekHistory";
import { deriveBrandState } from "../../features/progression/engine";
import { runDailySync } from "../../features/runtime/dailySync";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { CampVignette } from "../components/CampVignette";
import { DayCells } from "../components/DayCells";
import { DuelCard } from "../components/DuelCard";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { Screentone } from "../components/Screentone";

export function HomeScreen() {
  const router = useRouter();
  const stepsToday = usePedometerStore((state) => state.stepsToday);
  const distanceTodayKm = usePedometerStore((state) => state.distanceTodayKm);
  const history = usePedometerStore((state) => state.history);
  const resetStepsToday = usePedometerStore((state) => state.resetStepsToday);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedCount = usePlayerStore((state) => state.unlockedCheckpoints.length);
  const addDevSteps = usePlayerStore((state) => state.addDevSteps);
  const advanceToNextCheckpointDev = usePlayerStore((state) => state.advanceToNextCheckpointDev);
  const resetProgressionDev = usePlayerStore((state) => state.resetProgressionDev);
  const streakDays = useBrandStore((state) => state.status.streakDays);
  const threshold = useSettingsStore((state) => state.dailyGoal);

  const activeDuels = computeDuels(BOSS_ENCOUNTERS, progress.lapSteps, BERSERK_CHECKPOINTS).filter(
    (duel) => duel.state === "active",
  );
  const isCalm = deriveBrandState(stepsToday, threshold) === "active";
  const stepsLeftToday = Math.max(0, threshold - stepsToday);
  // L'historique du jour peut avoir un temps de retard sur le compteur : le compteur fait foi pour aujourd'hui.
  const week = lastDays(history, new Date()).map((day) => (day.isToday ? { ...day, steps: stepsToday } : day));
  const recordedDayKeys = new Set(Object.keys(history));

  const previousIndex = Math.max(
    0,
    BERSERK_CHECKPOINTS.findIndex((checkpoint) => checkpoint.id === progress.currentCheckpointId),
  );
  const previous = BERSERK_CHECKPOINTS[previousIndex];
  const next = BERSERK_CHECKPOINTS[previousIndex + 1] ?? null;
  const remainingKm = next ? Math.max(0, next.kmThreshold - progress.totalDistanceKm) : 0;
  const remainingSteps = Math.ceil((remainingKm * 1000) / GAME_CONFIG.metersPerStep);
  const journeyLine = [`sur ${formatInt(GAME_CONFIG.totalGoalKm)} km`, previous.arc, progress.lap > 1 ? `tour ${progress.lap}` : null]
    .filter(Boolean)
    .join(" · ");

  async function handleResetDev(): Promise<void> {
    await resetProgressionDev();
    await resetStepsToday();
  }

  return (
    <Screen scroll variant="page">
      <Panel
        slant
        style={styles.journey}
        accessible
        accessibilityLabel={`La Traque : ${formatDecimal(progress.totalDistanceKm)} kilomètres ${journeyLine}`}
      >
        {/* La trame encre la case à mesure qu'on avance dans la Traque. */}
        <Screentone color={theme.colors.tone} step={4} dot={1.3} style={{ width: `${progress.progressPct}%` }} />
        <View style={styles.journeyTop}>
          <Text {...theme.fitDisplayText} style={styles.km}>
            {formatDecimal(progress.totalDistanceKm)}
            <Text style={styles.kmUnit}> km</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Synchroniser la journée"
            onPress={() => void runDailySync()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.black} />
          </Pressable>
        </View>
        <Text style={styles.journeyLine}>{journeyLine}</Text>
        <View style={styles.journeyBar}>
          <ProgressBar pct={progress.progressPct} calm height={10} accessibilityLabel="Avancée dans la Traque" />
          {/* « Tu es ici » : le seul repère rouge du voyage. */}
          <View pointerEvents="none" style={[styles.hereTick, { left: `${Math.min(100, progress.progressPct)}%` }]} />
        </View>
      </Panel>

      <View style={styles.row}>
        <Panel style={styles.next}>
          {next ? (
            <>
              <Text style={styles.nextTitle}>{next.title}</Text>
              <View>
                <Text {...theme.fitDisplayText} style={styles.figure}>
                  {formatDecimal(remainingKm)}
                  <Text style={styles.figureUnit}> km</Text>
                </Text>
                <Text style={styles.small}>{`≈ ${formatInt(remainingSteps)} pas jusqu'au point ${formatInt(next.kmThreshold)} km`}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.nextTitle}>Périple accompli</Text>
              <Text style={styles.small}>{`Dernier point : ${previous.title}`}</Text>
            </>
          )}
        </Panel>

        <Panel reversed padded={false} style={styles.lockedPanel}>
          <Screentone color={theme.colors.toneDark} step={4} dot={1.2} />
          {next ? (
            <View
              style={styles.lockedCaption}
              accessible
              accessibilityLabel={`Case ${unlockedCount + 1} sur ${BERSERK_CHECKPOINTS.length}, se révèle à ${formatInt(next.kmThreshold)} kilomètres`}
            >
              <Ionicons name="lock-closed" size={16} color={theme.colors.black} />
              <Text style={styles.lockedText}>{`Case ${unlockedCount + 1} sur ${BERSERK_CHECKPOINTS.length}`}</Text>
              <Text style={styles.lockedSmall}>{`se révèle à ${formatInt(next.kmThreshold)} km`}</Text>
            </View>
          ) : (
            <View style={styles.lockedCaption}>
              <Text style={styles.lockedText}>{`${BERSERK_CHECKPOINTS.length} cases sur ${BERSERK_CHECKPOINTS.length}`}</Text>
            </View>
          )}
        </Panel>
      </View>

      <Panel reversed>
        <View style={styles.todayRow}>
          <View
            style={styles.todayCol}
            accessible
            accessibilityLabel={`Aujourd'hui : ${formatInt(stepsToday)} pas, objectif ${formatInt(threshold)}, soit ${formatDecimal(distanceTodayKm, 2)} kilomètres`}
          >
            <Text {...theme.fitDisplayText} style={[styles.figure, styles.onBlack]}>
              {formatInt(stepsToday)}
            </Text>
            <Text style={styles.smallOnBlack}>{`pas aujourd'hui · objectif ${formatInt(threshold)}`}</Text>
          </View>
          <View
            style={[styles.todayCol, styles.markCol]}
            accessible
            accessibilityLabel={isCalm ? "La Marque est apaisée" : `La Marque saigne : encore ${formatInt(stepsLeftToday)} pas`}
          >
            <View style={styles.markHead}>
              <BrandMark visual={{ state: isCalm ? "active" : "bleeding", intensity: isCalm ? 0.4 : 0.9 }} width={18} />
              <Text {...theme.fitDisplayText} style={[styles.figure, styles.onBlack, !isCalm && styles.figureRed]}>
                {isCalm ? "Apaisée" : formatInt(stepsLeftToday)}
              </Text>
            </View>
            <Text style={styles.smallOnBlack}>{isCalm ? "la Marque se tait" : "pas pour apaiser la Marque"}</Text>
          </View>
        </View>
        <View style={styles.week}>
          <DayCells days={week} thresholdSteps={threshold} recordedDayKeys={recordedDayKeys} reversed />
          <Text
            style={[styles.streak, styles.onBlack]}
            accessibilityLabel={`Série : ${streakDays} ${streakDays > 1 ? "jours" : "jour"}`}
          >{`Série ${streakDays} j`}</Text>
        </View>
      </Panel>

      {activeDuels.map((duel) => (
        <DuelCard key={duel.encounter.id} duel={duel} />
      ))}

      <Panel reversed padded={false}>
        <CampVignette scene={resolveCampScene(new Date().getHours(), isCalm, previous.title)} />
      </Panel>

      <Panel style={styles.totals}>
        <Total label="pas au total" value={formatInt(progress.totalSteps)} />
        <View style={styles.totalRule} />
        <Total label="de la Traque" value={`${formatDecimal(progress.progressPct)} %`} />
      </Panel>

      {__DEV__ ? (
        <Panel style={styles.dev}>
          <Text style={styles.devTitle}>Outils de développement</Text>
          <Button label="+500 pas" variant="secondary" onPress={() => void addDevSteps(500)} />
          <Button
            label={next ? `Aller à : ${next.title}` : "Parcours terminé"}
            variant="secondary"
            disabled={!next}
            onPress={() => void advanceToNextCheckpointDev()}
          />
          <Button label="Réinitialiser la progression" variant="danger" onPress={() => void handleResetDev()} />
          <Button label="Voir la carte" variant="secondary" onPress={() => router.push("/(tabs)/map")} />
        </Panel>
      ) : null}
    </Screen>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.total} accessible accessibilityLabel={`${value} ${label}`}>
      <Text {...theme.fitDisplayText} style={styles.totalValue}>
        {value}
      </Text>
      <Text style={styles.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  journey: { paddingTop: theme.space[8] },
  journeyTop: { flexDirection: "row", alignItems: "flex-start", gap: theme.space[8] },
  km: { ...theme.text.displayXl, color: theme.colors.black, flex: 1 },
  kmUnit: { ...theme.text.displayM, letterSpacing: 0 },
  iconButton: {
    width: 48,
    height: 48,
    marginTop: theme.space[8],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.paper,
  },
  iconButtonPressed: { backgroundColor: theme.colors.toneLight },
  journeyLine: { ...theme.text.bodyStrong, color: theme.colors.black },
  journeyBar: { marginTop: theme.space[16] },
  hereTick: { position: "absolute", top: -6, width: 4, marginLeft: -2, height: 26, backgroundColor: theme.colors.red },
  row: { flexDirection: "row", gap: theme.gutter },
  next: { flex: 1, minHeight: 176, justifyContent: "space-between", gap: theme.space[16] },
  nextTitle: { ...theme.text.displayS, color: theme.colors.black },
  figure: { ...theme.text.figure, color: theme.colors.black },
  figureRed: { color: theme.colors.redOnBlack },
  onBlack: { color: theme.colors.paper },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  figureUnit: { ...theme.text.bodyStrong },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  lockedPanel: { flex: 1, minHeight: 176, justifyContent: "flex-end" },
  lockedCaption: { margin: theme.space[8], padding: theme.space[8], backgroundColor: theme.colors.paper, gap: 2 },
  lockedText: { ...theme.text.bodyStrong, color: theme.colors.black },
  lockedSmall: { ...theme.text.small, color: theme.colors.blackSoft },
  todayRow: { flexDirection: "row" },
  todayCol: { flex: 1, gap: theme.space[4] },
  markCol: { borderLeftWidth: theme.frame, borderLeftColor: theme.colors.paper, paddingLeft: theme.space[16], marginLeft: theme.space[16] },
  markHead: { flexDirection: "row", alignItems: "center", gap: theme.space[8] },
  week: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.space[16], marginTop: theme.space[16] },
  streak: { ...theme.text.bodyStrong, color: theme.colors.black },
  totals: { flexDirection: "row" },
  totalRule: { width: theme.frame, backgroundColor: theme.colors.black, marginHorizontal: theme.space[16] },
  total: { flex: 1, gap: theme.space[4] },
  totalValue: { ...theme.text.displayM, color: theme.colors.black },
  dev: { gap: theme.space[8] },
  devTitle: { ...theme.text.bodyStrong, color: theme.colors.black },
});
