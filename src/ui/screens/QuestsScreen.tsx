import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { ENEMIES, enemyStatus } from "../../data/enemies";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { BOSS_ENCOUNTERS } from "../../data/bosses";
import { computeDuels, victoriousEncounterIds } from "../../features/bosses/duel";
import { buildAchievementStats } from "../../features/achievements/stats";
import { ACHIEVEMENTS } from "../../features/achievements/achievements";
import { isCompanionMet } from "../../features/companions/journey";
import { useBrandStore } from "../../store/useBrandStore";
import { usePedometerStore } from "../../store/usePedometerStore";
import { buildAchievementCard } from "../../features/share/shareCards";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useShareStore } from "../../store/useShareStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { DuelCard } from "../components/DuelCard";
import { AchievementList } from "../components/AchievementList";
import { CompanionCollection } from "../components/CompanionCollection";
import { EnemyCollection } from "../components/EnemyCollection";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { Screentone } from "../components/Screentone";
import { ZoomableImage } from "../components/ZoomableImage";

type QuestsTab = "daily" | "chronicles" | "companions" | "enemies" | "achievements";

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

type Quest = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  right: string;
  pct: number;
};

export function QuestsScreen() {
  const [tab, setTab] = useState<QuestsTab>("daily");
  const [lightboxPanel, setLightboxPanel] = useState<ImageSourcePropType | null>(null);
  const stepsToday = usePedometerStore((state) => state.stepsToday);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedIds = usePlayerStore((state) => state.unlockedCheckpoints);
  const streakDays = useBrandStore((state) => state.status.streakDays);
  const dailyGoal = useSettingsStore((state) => state.dailyGoal);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const bestDaySteps = usePlayerStore((state) => state.bestDaySteps);
  const bossVictories = usePlayerStore((state) => state.bossVictories);
  const achievements = usePlayerStore((state) => state.achievements);
  const requestShare = useShareStore((state) => state.requestShare);

  const unlocked = BERSERK_CHECKPOINTS.filter((checkpoint) => unlockedIds.includes(checkpoint.id));
  const chronicles = [...unlocked].reverse();
  const nextLocked = BERSERK_CHECKPOINTS.find((checkpoint) => !unlockedIds.includes(checkpoint.id)) ?? null;
  const metCount = COMPANIONS.filter((companion) => isCompanionMet(companion, unlockedIds)).length;
  // Le prochain point se lit sur la distance du tour : au deuxième tour, toutes les chroniques sont déjà lues.
  const nextOnRoute = BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.kmThreshold > progress.totalDistanceKm + 0.0001) ?? null;
  const quests = buildQuests(stepsToday, streakDays, progress.totalDistanceKm, progress.currentSegmentProgressPct, nextOnRoute, dailyGoal);
  const activeDuels = computeDuels(BOSS_ENCOUNTERS, progress.lapSteps, BERSERK_CHECKPOINTS).filter(
    (duel) => duel.state === "active",
  );
  const defeatedIds = victoriousEncounterIds(bossVictories);
  const enemiesMet = ENEMIES.filter((enemy) => enemyStatus(enemy, unlockedIds, defeatedIds) !== "unknown").length;
  const achievementStats = buildAchievementStats(progress, unlockedIds, bestStreak, bestDaySteps, bossVictories);
  const achievementCount = ACHIEVEMENTS.filter((achievement) => achievements[achievement.id]).length;

  return (
    <Screen scroll variant="page">
      <Panel reversed>
        <Text accessibilityRole="header" style={styles.title}>
          Quêtes
        </Text>

        <View accessibilityRole="tablist" style={styles.tabs}>
        <TabButton label="Du jour" selected={tab === "daily"} onPress={() => setTab("daily")} />
        <TabButton
          label="Chroniques"
          count={[unlocked.length, BERSERK_CHECKPOINTS.length]}
          selected={tab === "chronicles"}
          onPress={() => setTab("chronicles")}
        />
        <TabButton
          label="Compagnons"
          count={[metCount, COMPANIONS.length]}
          selected={tab === "companions"}
          onPress={() => setTab("companions")}
        />
        <TabButton
          label="Ennemis"
          count={[enemiesMet, ENEMIES.length]}
          selected={tab === "enemies"}
          onPress={() => setTab("enemies")}
        />
        <TabButton
          label="Succès"
          count={[achievementCount, ACHIEVEMENTS.length]}
          selected={tab === "achievements"}
          onPress={() => setTab("achievements")}
        />
        </View>
      </Panel>

      <View style={styles.list}>
        {tab === "daily" ? (
          <>
            {activeDuels.map((duel) => (
              <DuelCard key={duel.encounter.id} duel={duel} />
            ))}
            {quests.map((quest) => (
              <QuestRow key={quest.id} quest={quest} />
            ))}
          </>
        ) : tab === "companions" ? (
          <CompanionCollection unlockedCheckpointIds={unlockedIds} />
        ) : tab === "enemies" ? (
          <EnemyCollection unlockedCheckpointIds={unlockedIds} bossVictories={bossVictories} />
        ) : tab === "achievements" ? (
          <AchievementList
            stats={achievementStats}
            unlocked={achievements}
            onShare={(achievement) =>
              requestShare(buildAchievementCard(achievement, { totalSteps: progress.totalSteps, bestStreak, lap: progress.lap }))
            }
          />
        ) : (
            <>
              {chronicles.map((checkpoint) => (
                <ChronicleCard key={checkpoint.id} checkpoint={checkpoint} onOpenPanel={setLightboxPanel} />
              ))}
              {nextLocked ? (
                <Panel reversed style={styles.locked}>
                  <Screentone color={theme.colors.toneDark} step={4} dot={1.2} />
                  <Ionicons name="lock-closed" size={24} color={theme.colors.paper} />
                  <View style={styles.lockedText}>
                    <Text style={styles.lockedTitle}>{nextLocked.title}</Text>
                    <Text style={styles.smallOnBlack}>
                      {`Encore ${formatDecimal(Math.max(0, nextLocked.kmThreshold - progress.totalDistanceKm))} km avant de la lire`}
                    </Text>
                  </View>
                  <Text style={styles.lockedKm}>{`${formatInt(nextLocked.kmThreshold)} km`}</Text>
                </Panel>
              ) : null}
            </>
          )}
      </View>

      <Modal visible={lightboxPanel !== null} transparent animationType="fade" onRequestClose={() => setLightboxPanel(null)}>
        <View style={styles.lightbox}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={styles.closeButton}
            onPress={() => setLightboxPanel(null)}
          >
            <Ionicons name="close" size={24} color={theme.colors.paper} />
          </Pressable>
          {lightboxPanel ? (
            <ZoomableImage source={lightboxPanel} accessibilityLabel="Planche du manga, agrandissable en pinçant" />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

function buildQuests(
  stepsToday: number,
  streakDays: number,
  totalKm: number,
  segmentPct: number,
  nextLocked: BerserkCheckpoint | null,
  threshold: number,
): Quest[] {
  const streakTarget = STREAK_MILESTONES.find((milestone) => milestone > streakDays) ?? streakDays;

  const quests: Quest[] = [
    {
      id: "threshold",
      title: "Apaiser la Marque",
      description: `Franchir ${formatInt(threshold)} pas dans la journée`,
      done: stepsToday >= threshold,
      right: stepsToday >= threshold ? "Accomplie" : `${formatInt(stepsToday)} / ${formatInt(threshold)}`,
      pct: (stepsToday / threshold) * 100,
    },
    {
      id: "streak",
      title: "Tenir la série",
      description: `Marcher ${streakTarget} jours d'affilée sans laisser la Marque saigner`,
      done: false,
      right: `${streakDays} / ${streakTarget}`,
      pct: (streakDays / streakTarget) * 100,
    },
  ];

  if (nextLocked) {
    quests.push({
      id: "checkpoint",
      title: "Atteindre le prochain point",
      description: `${nextLocked.title} · ${formatDecimal(Math.max(0, nextLocked.kmThreshold - totalKm))} km restants`,
      done: false,
      right: `${Math.round(segmentPct)} %`,
      pct: segmentPct,
    });
  }

  return quests;
}

type TabButtonProps = {
  label: string;
  /** [débloqués, total] : affiché sous le libellé, sur sa propre ligne. */
  count?: [number, number];
  selected: boolean;
  onPress: () => void;
};

function TabButton({ label, count, selected, onPress }: TabButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={count ? `${label}, ${count[0]} sur ${count[1]}` : label}
      onPress={onPress}
      style={[styles.tabButton, selected && styles.tabButtonSelected]}
    >
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
      {count ? (
        <Text style={[styles.tabCount, selected && styles.tabLabelSelected]}>{`${count[0]} / ${count[1]}`}</Text>
      ) : null}
    </Pressable>
  );
}

function QuestRow({ quest }: { quest: Quest }) {
  // Une seule phrase pour TalkBack : la coche seule ne dit pas que la quête est accomplie.
  const status = quest.done ? "accomplie" : `en cours, ${quest.right}`;

  return (
    <Panel style={styles.quest} accessible accessibilityLabel={`${quest.title}, ${status}. ${quest.description}`}>
      <View style={[styles.questBox, quest.done && styles.questBoxDone]}>
        {quest.done ? <Ionicons name="checkmark" size={20} color={theme.colors.paper} /> : null}
      </View>
      <View style={styles.questText}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <Text style={styles.small}>{quest.description}</Text>
        {quest.done ? null : (
          <View style={styles.questBar}>
            <ProgressBar pct={quest.pct} calm />
          </View>
        )}
      </View>
      <Text style={styles.questRight}>{quest.right}</Text>
    </Panel>
  );
}

type ChronicleCardProps = {
  checkpoint: BerserkCheckpoint;
  onOpenPanel: (panel: ImageSourcePropType) => void;
};

function ChronicleCard({ checkpoint, onOpenPanel }: ChronicleCardProps) {
  const panel = BERSERK_PANEL_IMAGES[checkpoint.id];

  return (
    <Pressable
      accessibilityRole={panel ? "imagebutton" : undefined}
      accessibilityLabel={panel ? `Agrandir la planche : ${checkpoint.title}` : undefined}
      disabled={!panel}
      onPress={() => panel && onOpenPanel(panel)}
    >
      <Panel padded={false} style={styles.chronicle}>
        <View style={styles.chronicleThumb}>
          {panel ? (
            <Image source={panel} style={styles.thumbImage} resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : (
            <Ionicons name="book-outline" size={32} color={theme.colors.paper} />
          )}
        </View>
        <View style={styles.chronicleText}>
          <Text style={styles.chronicleTitle}>{checkpoint.title}</Text>
          <Text style={styles.chronicleMeta}>{`${formatInt(checkpoint.kmThreshold)} km · ${checkpoint.arc}`}</Text>
          <Text style={styles.chronicleDescription}>
            {checkpoint.description}
          </Text>
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.text.displayL, color: theme.colors.paper },
  // Les onglets : des cases dans l'en-tête noir ; l'onglet ouvert est la case de papier.
  tabs: { marginTop: theme.space[16], flexDirection: "row", flexWrap: "wrap", gap: theme.gutter },
  tabButton: {
    flexBasis: "30%",
    flexGrow: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.space[8],
    paddingHorizontal: theme.space[4],
    borderWidth: theme.frame,
    borderColor: theme.colors.toneDark,
  },
  tabButtonSelected: { backgroundColor: theme.colors.paper, borderColor: theme.colors.paper },
  tabLabel: { ...theme.text.label, letterSpacing: 0, fontSize: 14, lineHeight: 20, color: theme.colors.paper, textAlign: "center" },
  tabCount: { ...theme.text.small, color: theme.colors.paperSoft, textAlign: "center" },
  tabLabelSelected: { color: theme.colors.black },
  list: { gap: theme.gutter },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  quest: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  questBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
  },
  questBoxDone: { backgroundColor: theme.colors.black },
  questText: { flex: 1, gap: 2 },
  questTitle: { ...theme.text.displayS, color: theme.colors.black },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  questBar: { marginTop: theme.space[8] },
  questRight: { ...theme.text.bodyStrong, color: theme.colors.black, textAlign: "right" },
  chronicle: { flexDirection: "row", minHeight: 136 },
  chronicleThumb: { width: 112, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.black },
  thumbImage: { width: "100%", height: "100%" },
  chronicleText: { flex: 1, padding: theme.space[16], gap: theme.space[4] },
  chronicleTitle: { ...theme.text.displayS, color: theme.colors.black },
  chronicleMeta: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.red },
  chronicleDescription: { ...theme.text.small, color: theme.colors.blackSoft },
  locked: { flexDirection: "row", alignItems: "center", gap: theme.space[16], minHeight: 96 },
  lockedText: { flex: 1, gap: 2 },
  lockedTitle: { ...theme.text.displayS, color: theme.colors.paper },
  lockedKm: { ...theme.text.displayS, color: theme.colors.paper },
  // En haut, la place du bouton Fermer ; la planche et ses boutons de zoom occupent le reste.
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(17,17,17,0.97)",
    paddingHorizontal: theme.space[16],
    paddingTop: theme.space[48] + 48 + theme.space[16],
    paddingBottom: theme.space[32],
  },
  closeButton: {
    position: "absolute",
    top: theme.space[48],
    right: theme.space[16],
    zIndex: 2,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
    borderColor: theme.colors.paper,
    backgroundColor: theme.colors.black,
  },
});
