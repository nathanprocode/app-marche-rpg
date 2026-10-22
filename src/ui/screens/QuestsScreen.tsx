import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { ENEMIES, enemyStatus } from "../../data/enemies";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { victoriousEncounterIds } from "../../features/bosses/duel";
import { buildAchievementStats } from "../../features/achievements/stats";
import { ACHIEVEMENTS } from "../../features/achievements/achievements";
import { isCompanionMet } from "../../features/companions/journey";
import { buildAchievementCard } from "../../features/share/shareCards";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useShareStore } from "../../store/useShareStore";
import { AchievementList } from "../components/AchievementList";
import { CompanionCollection } from "../components/CompanionCollection";
import { EnemyCollection } from "../components/EnemyCollection";
import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { Screentone } from "../components/Screentone";
import { ZoomableImage } from "../components/ZoomableImage";

type CollectionTab = "chronicles" | "companions" | "enemies" | "achievements";

/**
 * Onglet « Collection » : ce que le voyage a amassé (chroniques, compagnons, ennemis, succès).
 * Les objectifs du jour (Marque, série, duels, prochain point) vivent sur l'accueil.
 */
export function QuestsScreen() {
  const [tab, setTab] = useState<CollectionTab>("chronicles");
  const [lightboxPanel, setLightboxPanel] = useState<ImageSourcePropType | null>(null);
  const progress = usePlayerStore((state) => state.progress);
  const unlockedIds = usePlayerStore((state) => state.unlockedCheckpoints);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const bestDaySteps = usePlayerStore((state) => state.bestDaySteps);
  const bossVictories = usePlayerStore((state) => state.bossVictories);
  const achievements = usePlayerStore((state) => state.achievements);
  const requestShare = useShareStore((state) => state.requestShare);

  const unlocked = BERSERK_CHECKPOINTS.filter((checkpoint) => unlockedIds.includes(checkpoint.id));
  const chronicles = [...unlocked].reverse();
  const nextLocked = BERSERK_CHECKPOINTS.find((checkpoint) => !unlockedIds.includes(checkpoint.id)) ?? null;
  const metCount = COMPANIONS.filter((companion) => isCompanionMet(companion, unlockedIds)).length;
  const defeatedIds = victoriousEncounterIds(bossVictories);
  const enemiesMet = ENEMIES.filter((enemy) => enemyStatus(enemy, unlockedIds, defeatedIds) !== "unknown").length;
  const achievementStats = buildAchievementStats(progress, unlockedIds, bestStreak, bestDaySteps, bossVictories);
  const achievementCount = ACHIEVEMENTS.filter((achievement) => achievements[achievement.id]).length;

  return (
    <Screen scroll variant="page">
      <Panel reversed>
        <Text accessibilityRole="header" style={styles.title}>
          Collection
        </Text>

        <View accessibilityRole="tablist" style={styles.tabs}>
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
        {tab === "companions" ? (
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
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
        {label}
      </Text>
      {count ? (
        <Text style={[styles.tabCount, selected && styles.tabLabelSelected]}>{`${count[0]} / ${count[1]}`}</Text>
      ) : null}
    </Pressable>
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
  // Les onglets : quatre cases sur une ligne dans l'en-tête noir ; l'onglet ouvert est la case de papier.
  tabs: { marginTop: theme.space[16], flexDirection: "row", gap: theme.gutter },
  tabButton: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.space[8],
    paddingHorizontal: theme.space[4],
    borderWidth: theme.frame,
    borderColor: theme.colors.toneDark,
  },
  tabButtonSelected: { backgroundColor: theme.colors.paper, borderColor: theme.colors.paper },
  tabLabel: { ...theme.text.label, letterSpacing: 0, fontSize: 13, lineHeight: 18, color: theme.colors.paper, textAlign: "center" },
  tabCount: { ...theme.text.small, color: theme.colors.paperSoft, textAlign: "center" },
  tabLabelSelected: { color: theme.colors.black },
  list: { gap: theme.gutter },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  chronicle: { flexDirection: "row", minHeight: 136 },
  chronicleThumb: { width: 112, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: theme.colors.black },
  // En fond de la colonne (position absolue) : c'est le texte qui donne la hauteur de la carte. Dans le flux, Android
  // prenait la hauteur naturelle de la planche et la carte s'étirait sur tout l'écran. La colonne n'a pas de marges
  // intérieures : les 100 % y sont justes sur Android comme sur le web.
  thumbImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  chronicleText: { flex: 1, padding: theme.space[16], gap: theme.space[4] },
  chronicleTitle: { ...theme.text.displayS, color: theme.colors.black },
  chronicleMeta: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.blackSoft },
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
