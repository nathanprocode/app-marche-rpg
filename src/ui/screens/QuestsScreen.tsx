import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { BOSS_ENCOUNTERS } from "../../data/bosses";
import { computeDuels } from "../../features/bosses/duel";
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
import { InkCard } from "../components/InkCard";
import { PaperCard } from "../components/PaperCard";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { ZoomableImage } from "../components/ZoomableImage";

type QuestsTab = "daily" | "chronicles" | "companions" | "achievements";

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
  const achievementStats = buildAchievementStats(progress, unlockedIds, bestStreak, bestDaySteps, bossVictories);
  const achievementCount = ACHIEVEMENTS.filter((achievement) => achievements[achievement.id]).length;

  return (
    <Screen scroll>
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
          label="Succès"
          count={[achievementCount, ACHIEVEMENTS.length]}
          selected={tab === "achievements"}
          onPress={() => setTab("achievements")}
        />
      </View>

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
                <View style={styles.locked}>
                  <Ionicons name="lock-closed-outline" size={24} color={theme.colors.boneDim} />
                  <View style={styles.lockedText}>
                    <Text style={styles.lockedTitle}>{nextLocked.title}</Text>
                    <Text style={styles.small}>
                      {`Encore ${formatDecimal(Math.max(0, nextLocked.kmThreshold - progress.totalDistanceKm))} km avant de la lire`}
                    </Text>
                  </View>
                  <Text style={styles.lockedKm}>{`${formatInt(nextLocked.kmThreshold)} km`}</Text>
                </View>
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
            <Ionicons name="close" size={24} color={theme.colors.bone} />
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
    <InkCard style={styles.quest} accessible accessibilityLabel={`${quest.title}, ${status}. ${quest.description}`}>
      {quest.done ? (
        <View style={styles.questDone}>
          <Ionicons name="checkmark" size={16} color={theme.colors.bone} />
        </View>
      ) : (
        <View style={styles.questOpen} />
      )}
      <View style={styles.questText}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <Text style={styles.small}>{quest.description}</Text>
        {quest.done ? null : (
          <View style={styles.questBar}>
            <ProgressBar pct={quest.pct} />
          </View>
        )}
      </View>
      <Text style={styles.questRight}>{quest.right}</Text>
    </InkCard>
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
      <PaperCard style={styles.chronicle}>
        <View style={styles.chronicleThumb}>
          {panel ? (
            <View pointerEvents="none" style={styles.thumbBlend}>
              <Image source={panel} style={styles.thumbImage} resizeMode="cover" accessibilityIgnoresInvertColors />
            </View>
          ) : (
            <Ionicons name="book-outline" size={32} color={theme.colors.umber} />
          )}
        </View>
        <View style={styles.chronicleText}>
          <Text style={styles.chronicleKicker}>{`${formatInt(checkpoint.kmThreshold)} km · ${checkpoint.arc}`}</Text>
          <Text style={styles.chronicleTitle}>{checkpoint.title}</Text>
          <Text numberOfLines={2} style={styles.chronicleDescription}>
            {checkpoint.description}
          </Text>
        </View>
      </PaperCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...theme.text.displayL, color: theme.colors.bone },
  tabs: {
    marginTop: theme.space[16],
    flexDirection: "row",
    flexWrap: "wrap",
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
    overflow: "hidden",
  },
  tabButton: { width: "50%", alignItems: "center", justifyContent: "center", paddingVertical: theme.space[8] },
  tabButtonSelected: { backgroundColor: theme.colors.bone },
  tabLabel: { ...theme.text.label, fontSize: 14, lineHeight: 20, color: theme.colors.boneDim, textAlign: "center" },
  tabCount: { ...theme.text.small, color: theme.colors.boneDim, textAlign: "center" },
  tabLabelSelected: { color: theme.colors.ink },
  list: { marginTop: theme.space[24], gap: theme.space[16] },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  quest: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  questDone: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: theme.colors.blood,
    borderWidth: 1,
    borderColor: theme.colors.bloodGlow,
  },
  questOpen: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.iron },
  questText: { flex: 1 },
  questTitle: { ...theme.text.bodyStrong, color: theme.colors.bone },
  questBar: { marginTop: theme.space[8] },
  questRight: { ...theme.text.label, color: theme.colors.boneDim, textAlign: "right" },
  chronicle: { flexDirection: "row", padding: 0, minHeight: 120 },
  chronicleThumb: { width: 112, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bone },
  thumbBlend: { ...StyleSheet.absoluteFillObject, mixBlendMode: "multiply" },
  thumbImage: { width: "100%", height: "100%" },
  chronicleText: { flex: 1, paddingVertical: 12, paddingHorizontal: theme.space[16], gap: theme.space[4] },
  chronicleKicker: { ...theme.text.label, color: theme.colors.blood },
  chronicleTitle: { ...theme.text.displayS, color: theme.colors.ink },
  chronicleDescription: { ...theme.text.small, color: theme.colors.umber },
  locked: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    padding: theme.space[16],
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
  },
  lockedText: { flex: 1 },
  lockedTitle: { ...theme.text.body, color: theme.colors.bone },
  lockedKm: { ...theme.text.displayS, color: theme.colors.boneDim },
  // En haut, la place du bouton Fermer ; la planche et ses boutons de zoom occupent le reste.
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(12,10,9,0.96)",
    paddingHorizontal: theme.space[16],
    paddingTop: theme.space[48] + 44 + theme.space[16],
    paddingBottom: theme.space[32],
  },
  closeButton: {
    position: "absolute",
    top: theme.space[48],
    right: theme.space[24],
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
    backgroundColor: theme.colors.inkRaised,
  },
});
