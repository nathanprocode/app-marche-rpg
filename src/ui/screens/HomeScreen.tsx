import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { BOSS_ENCOUNTERS } from "../../data/bosses";
import { computeDuels } from "../../features/bosses/duel";
import { resolveCampScene } from "../../features/camp/campScene";
import { deriveBrandState } from "../../features/progression/engine";
import { runDailySync } from "../../features/runtime/dailySync";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { CampVignette } from "../components/CampVignette";
import { DuelCard } from "../components/DuelCard";
import { InkCard } from "../components/InkCard";
import { PaperCard } from "../components/PaperCard";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";

/** Outil de test (mode développement seulement) : forcer la scène du camp de jour ou de nuit, quelle que soit l'heure. */
const DEV_DAY_HOUR = 14;
const DEV_NIGHT_HOUR = 22;

export function HomeScreen() {
  const router = useRouter();
  const [devCampHour, setDevCampHour] = useState<number | null>(null);
  const stepsToday = usePedometerStore((state) => state.stepsToday);
  const distanceTodayKm = usePedometerStore((state) => state.distanceTodayKm);
  const resetStepsToday = usePedometerStore((state) => state.resetStepsToday);
  const progress = usePlayerStore((state) => state.progress);
  const addDevSteps = usePlayerStore((state) => state.addDevSteps);
  const advanceToNextCheckpointDev = usePlayerStore((state) => state.advanceToNextCheckpointDev);
  const resetProgressionDev = usePlayerStore((state) => state.resetProgressionDev);
  const streakDays = useBrandStore((state) => state.status.streakDays);

  const activeDuels = computeDuels(BOSS_ENCOUNTERS, progress.lapSteps, BERSERK_CHECKPOINTS).filter(
    (duel) => duel.state === "active",
  );
  const threshold = useSettingsStore((state) => state.dailyGoal);
  const isCalm = deriveBrandState(stepsToday, threshold) === "active";
  const stepsLeftToday = Math.max(0, threshold - stepsToday);

  const previousIndex = Math.max(
    0,
    BERSERK_CHECKPOINTS.findIndex((checkpoint) => checkpoint.id === progress.currentCheckpointId),
  );
  const previous = BERSERK_CHECKPOINTS[previousIndex];
  const next = BERSERK_CHECKPOINTS[previousIndex + 1] ?? null;
  const remainingKm = next ? Math.max(0, next.kmThreshold - progress.totalDistanceKm) : 0;
  const remainingSteps = Math.ceil((remainingKm * 1000) / GAME_CONFIG.metersPerStep);
  const panel = BERSERK_PANEL_IMAGES[previous.id];

  async function handleResetDev(): Promise<void> {
    await resetProgressionDev();
    await resetStepsToday();
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.appName}>
          Marche du Faucon
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Synchroniser la journée"
          onPress={() => void runDailySync()}
          style={styles.iconButton}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.bone} />
        </Pressable>
      </View>

      <View
        style={styles.hero}
        accessible
        accessibilityLabel={`Pas du jour : ${formatInt(stepsToday)}, soit ${formatDecimal(distanceTodayKm, 2)} kilomètres`}
      >
        <Text style={styles.label}>Pas du jour</Text>
        <Text {...theme.fitDisplayText} style={styles.steps}>
          {formatInt(stepsToday)}
        </Text>
        <Text style={styles.heroMeta}>{`soit ${formatDecimal(distanceTodayKm, 2)} km parcourus`}</Text>
      </View>

      <View style={styles.camp}>
        <CampVignette scene={resolveCampScene(devCampHour ?? new Date().getHours(), isCalm, previous.title)} />
      </View>

      <InkCard alert={!isCalm} style={styles.brandStrip}>
        <BrandMark visual={{ state: isCalm ? "active" : "bleeding", intensity: isCalm ? 0.4 : 0.9 }} width={24} />
        <View style={styles.brandText}>
          <Text style={[styles.label, !isCalm && styles.labelAlert]}>La Marque</Text>
          <Text style={styles.body}>
            {isCalm
              ? `Apaisée · seuil de ${formatInt(threshold)} pas franchi`
              : `Elle saigne · encore ${formatInt(stepsLeftToday)} pas`}
          </Text>
          <ProgressBar pct={(stepsToday / threshold) * 100} calm={isCalm} accessibilityLabel="Seuil de pas du jour" />
        </View>
        <View
          style={styles.streak}
          accessible
          accessibilityLabel={`Série : ${streakDays} ${streakDays > 1 ? "jours" : "jour"}`}
        >
          <Text {...theme.fitDisplayText} style={styles.streakValue}>
            {streakDays}
          </Text>
          <Text style={styles.label}>{streakDays > 1 ? "jours" : "jour"}</Text>
        </View>
      </InkCard>

      {activeDuels.map((duel) => (
        <View key={duel.encounter.id} style={styles.duel}>
          <DuelCard duel={duel} />
        </View>
      ))}

      <PaperCard style={styles.journey}>
        {panel ? (
          <View style={styles.panelFrame}>
            <View style={styles.panelBlend}>
              <Image source={panel} style={styles.panel} resizeMode="cover" accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.panelCaption}>
              <Text style={styles.panelCaptionText}>
                {`Dernier point · ${previous.title} · ${formatInt(previous.kmThreshold)} km`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.journeyBody}>
          {next ? (
            <>
              <Text style={styles.paperKicker}>{`${progress.lap > 1 ? `Tour ${progress.lap} · ` : ""}Prochain point · ${formatInt(next.kmThreshold)} km`}</Text>
              <Text style={styles.paperTitle}>{next.title}</Text>
              <View style={styles.paperBar}>
                <ProgressBar
                  pct={progress.currentSegmentProgressPct}
                  onPaper
                  height={8}
                  accessibilityLabel={`Trajet vers ${next.title}`}
                />
              </View>
              <View style={styles.paperRow}>
                <Text style={styles.paperSmall}>{`${formatInt(previous.kmThreshold)} km`}</Text>
                <Text style={styles.paperSmall}>
                  {`${formatDecimal(remainingKm)} km restants · ≈ ${formatInt(remainingSteps)} pas`}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.paperKicker}>Périple accompli</Text>
              <Text style={styles.paperTitle}>{previous.title}</Text>
            </>
          )}
        </View>
      </PaperCard>

      <View style={styles.totals}>
        <Total label="Pas au total" value={formatInt(progress.totalSteps)} />
        <Total label="Distance" value={`${formatDecimal(progress.totalDistanceKm)} km`} />
        <Total label="Trajet" value={`${formatDecimal(progress.progressPct)} %`} />
      </View>

      {__DEV__ ? (
        <View style={styles.dev}>
          <Text style={styles.label}>Outils de développement</Text>
          <Button label="+500 pas" variant="secondary" onPress={() => void addDevSteps(500)} />
          <Button
            label={next ? `Aller à : ${next.title}` : "Parcours terminé"}
            variant="secondary"
            disabled={!next}
            onPress={() => void advanceToNextCheckpointDev()}
          />
          <Button
            label={`Scène du camp : ${devCampHour === null ? "automatique" : devCampHour === DEV_DAY_HOUR ? "jour" : "nuit"}`}
            variant="secondary"
            onPress={() => setDevCampHour((hour) => (hour === null ? DEV_DAY_HOUR : hour === DEV_DAY_HOUR ? DEV_NIGHT_HOUR : null))}
          />
          <Button label="Réinitialiser la progression" variant="danger" onPress={() => void handleResetDev()} />
          <Button label="Voir la carte" variant="secondary" onPress={() => router.push("/(tabs)/map")} />
        </View>
      ) : null}
    </Screen>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.total} accessible accessibilityLabel={`${label} : ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text {...theme.fitDisplayText} style={styles.totalValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  appName: { ...theme.text.displayM, color: theme.colors.bone, flex: 1 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
  },
  duel: { marginTop: theme.space[16] },
  camp: { marginTop: theme.space[16] },
  hero: { marginTop: theme.space[16] },
  label: { ...theme.text.label, color: theme.colors.boneDim },
  labelAlert: { color: theme.colors.bloodEmber },
  steps: { ...theme.text.displayXl, color: theme.colors.bone },
  heroMeta: { ...theme.text.body, color: theme.colors.boneDim },
  body: { ...theme.text.body, color: theme.colors.bone },
  brandStrip: {
    marginTop: theme.space[16],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    paddingVertical: theme.space[8],
  },
  brandText: { flex: 1, gap: theme.space[4] },
  streak: { alignItems: "flex-end" },
  streakValue: { ...theme.text.displayM, color: theme.colors.bone },
  journey: { marginTop: theme.space[16], paddingBottom: theme.space[16] },
  panelFrame: { height: 168, overflow: "hidden", backgroundColor: theme.colors.bone },
  panelBlend: { flex: 1, mixBlendMode: "multiply" },
  panel: { width: "100%", height: "100%" },
  panelCaption: {
    position: "absolute",
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.ink,
    paddingVertical: theme.space[4],
    paddingHorizontal: theme.space[8],
  },
  panelCaptionText: { ...theme.text.label, color: theme.colors.bone },
  journeyBody: { paddingHorizontal: theme.space[8], paddingTop: theme.space[16] },
  paperKicker: { ...theme.text.label, color: theme.colors.blood },
  paperTitle: { ...theme.text.displayM, color: theme.colors.ink },
  paperBar: { marginTop: theme.space[16] },
  paperRow: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.space[8], gap: theme.space[8] },
  paperSmall: { ...theme.text.small, color: theme.colors.umber },
  totals: { marginTop: theme.space[16], flexDirection: "row", gap: theme.space[16] },
  total: { flex: 1, borderTopWidth: 1, borderTopColor: theme.colors.ash, paddingTop: theme.space[8] },
  totalValue: { ...theme.text.displayM, color: theme.colors.bone },
  dev: { marginTop: theme.space[32], gap: theme.space[8] },
});
