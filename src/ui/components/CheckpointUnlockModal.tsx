import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../core/theme";
import { formatInt } from "../../core/format";
import { COMPANIONS } from "../../data/companions";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { getCompanionsMetAt } from "../../features/companions/journey";
import { buildCheckpointCard } from "../../features/share/shareCards";
import { useShareStore } from "../../store/useShareStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { vibrate } from "../../features/haptics/haptics";
import { useUIStore } from "../../store/useUIStore";
import { BrandMark } from "./BrandMark";
import { CompanionSprite } from "./CompanionSprite";
import { Button } from "./Button";
import { SpeedLines } from "./SpeedLines";

type CheckpointUnlockModalProps = {
  enabled: boolean;
};

/** Écran « Point atteint » : s'affiche quand un nouveau checkpoint est franchi. */
export function CheckpointUnlockModal({ enabled }: CheckpointUnlockModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);
  const progress = usePlayerStore((state) => state.progress);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const requestShare = useShareStore((state) => state.requestShare);
  const previousIdsRef = useRef<string[] | null>(null);
  const [checkpoint, setCheckpoint] = useState<BerserkCheckpoint | null>(null);

  useEffect(() => {
    const previousIds = previousIdsRef.current;

    // Le premier chargement ne compte pas : on ne fête que les points franchis pendant l'utilisation.
    if (!enabled || previousIds === null) {
      previousIdsRef.current = unlockedCheckpoints;
      return;
    }

    const newIds = unlockedCheckpoints.filter((id) => !previousIds.includes(id));
    previousIdsRef.current = unlockedCheckpoints;

    if (newIds.length === 0) {
      return;
    }

    const latest = BERSERK_CHECKPOINTS.filter((item) => newIds.includes(item.id)).sort(
      (a, b) => b.kmThreshold - a.kmThreshold,
    )[0];

    if (latest) {
      setCheckpoint(latest);
      vibrate("checkpoint");
    }
  }, [enabled, unlockedCheckpoints]);

  const setCheckpointModalOpen = useUIStore((state) => state.setCheckpointModalOpen);
  useEffect(() => {
    setCheckpointModalOpen(checkpoint !== null);
  }, [checkpoint, setCheckpointModalOpen]);

  function dismiss(): void {
    setCheckpoint(null);
  }

  function showOnMap(): void {
    setCheckpoint(null);
    router.push("/(tabs)/map");
  }

  const panel = checkpoint ? BERSERK_PANEL_IMAGES[checkpoint.id] : undefined;

  return (
    <Modal visible={checkpoint !== null} animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.screen}>
        <View style={styles.topRule} />
        {checkpoint ? (
          <>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space[32] }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <SpeedLines style={styles.speedLines} />
                <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={20} />
                <Text accessibilityRole="header" style={styles.title}>
                  {checkpoint.title}
                </Text>
                <Text style={styles.meta}>{`Nouveau chapitre à ${formatInt(checkpoint.kmThreshold)} km (${checkpoint.arc})`}</Text>
              </View>

              {panel ? (
                <View style={styles.plate}>
                  <Image source={panel} style={styles.panel} resizeMode="cover" accessibilityIgnoresInvertColors />
                </View>
              ) : null}

              <Text style={styles.description}>{checkpoint.description}</Text>

              {getCompanionsMetAt(checkpoint.id, COMPANIONS).map((companion) => (
                <View
                  key={companion.id}
                  style={styles.companion}
                  accessible
                  accessibilityLabel={`Nouveau compagnon : ${companion.name}, ${companion.title}`}
                >
                  <CompanionSprite companion={companion} size={64} />
                  <View style={styles.companionText}>
                    <Text style={styles.companionName}>{companion.name}</Text>
                    <Text style={styles.companionTitle}>{`Nouveau compagnon · ${companion.title}`}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
              <Button label="Continuer la marche" onDark onPress={dismiss} />
              <Button label="Voir sur la carte" variant="secondary" onDark onPress={showOnMap} />
              <Button
                label="Partager"
                variant="text"
                onDark
                onPress={() =>
                  requestShare(
                    buildCheckpointCard(checkpoint, { totalSteps: progress.totalSteps, bestStreak, lap: progress.lap }, panel),
                  )
                }
              />
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.black },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: theme.gutter, backgroundColor: theme.colors.redOnBlack, zIndex: 2 },
  header: { alignItems: "center", paddingVertical: theme.space[24] },
  // Les lignes de concentration débordent de l'en-tête pour couvrir toute la largeur de la page.
  speedLines: { top: -theme.space[48], bottom: -theme.space[24], left: -theme.space[16], right: -theme.space[16] },
  title: { ...theme.text.displayL, color: theme.colors.paper, marginTop: theme.space[16], textAlign: "center" },
  meta: { ...theme.text.bodyStrong, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[4] },
  content: { paddingHorizontal: theme.space[16], paddingBottom: theme.space[16] },
  // La case du manga, cadrée de papier comme une planche posée sur la page noire.
  plate: { marginTop: theme.space[24], borderWidth: theme.gutter, borderColor: theme.colors.paper, backgroundColor: theme.colors.paper },
  panel: { width: "100%", height: 260 },
  description: { ...theme.text.body, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[16] },
  companion: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    marginTop: theme.space[24],
    padding: theme.space[16],
    backgroundColor: theme.colors.paper,
  },
  companionText: { flex: 1, gap: 2 },
  companionName: { ...theme.text.displayS, color: theme.colors.black },
  companionTitle: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.blackSoft },
  footer: {
    paddingHorizontal: theme.space[16],
    paddingTop: theme.space[16],
    gap: theme.space[8],
    borderTopWidth: theme.frame,
    borderTopColor: theme.colors.toneDark,
  },
});
