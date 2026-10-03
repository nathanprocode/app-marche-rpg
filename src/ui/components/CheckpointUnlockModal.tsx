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
import { shareMessage } from "../../features/share/share";
import { buildCheckpointShare } from "../../features/share/shareMessages";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useUIStore } from "../../store/useUIStore";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";
import { PaperCard } from "./PaperCard";

type CheckpointUnlockModalProps = {
  enabled: boolean;
};

/** Écran « Point atteint » : s'affiche quand un nouveau checkpoint est franchi. */
export function CheckpointUnlockModal({ enabled }: CheckpointUnlockModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);
  const lap = usePlayerStore((state) => state.progress.lap);
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
                <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={20} />
                <Text style={styles.kicker}>{`Nouveau chapitre · ${checkpoint.arc}`}</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {checkpoint.title}
                </Text>
                <Text style={styles.meta}>{`Point franchi · ${formatInt(checkpoint.kmThreshold)} km`}</Text>
              </View>

              {panel ? (
                <PaperCard style={styles.plate}>
                  <View style={styles.panelBlend}>
                    <Image source={panel} style={styles.panel} resizeMode="cover" accessibilityIgnoresInvertColors />
                  </View>
                </PaperCard>
              ) : null}

              <Text style={styles.description}>{checkpoint.description}</Text>

              {getCompanionsMetAt(checkpoint.id, COMPANIONS).map((companion) => (
                <View
                  key={companion.id}
                  style={styles.companion}
                  accessible
                  accessibilityLabel={`Nouveau compagnon : ${companion.name}, ${companion.title}`}
                >
                  <Image source={companion.image} style={styles.companionSprite} resizeMode="contain" />
                  <View style={styles.companionText}>
                    <Text style={styles.companionKicker}>Nouveau compagnon</Text>
                    <Text style={styles.companionName}>{companion.name}</Text>
                    <Text style={styles.companionTitle}>{companion.title}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
              <Button label="Continuer la marche" onPress={dismiss} />
              <Button label="Voir sur la carte" variant="secondary" onPress={showOnMap} />
              <Button
                label="Partager"
                variant="secondary"
                onPress={() => void shareMessage(buildCheckpointShare(checkpoint, lap))}
              />
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.ink },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: theme.colors.bloodGlow, zIndex: 2 },
  content: { paddingHorizontal: theme.space[24], paddingBottom: theme.space[16] },
  header: { alignItems: "center" },
  kicker: { ...theme.text.label, color: theme.colors.bloodEmber, marginTop: theme.space[16], textAlign: "center" },
  title: { ...theme.text.displayL, color: theme.colors.bone, marginTop: theme.space[8], textAlign: "center" },
  meta: { ...theme.text.body, color: theme.colors.boneDim, textAlign: "center" },
  plate: { marginTop: theme.space[24] },
  panelBlend: { mixBlendMode: "multiply" },
  panel: { width: "100%", height: 232 },
  description: {
    ...theme.text.body,
    fontFamily: theme.fontFamily.bodyItalic,
    color: theme.colors.boneDim,
    textAlign: "center",
    marginTop: theme.space[16],
  },
  companion: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    marginTop: theme.space[24],
    padding: theme.space[16],
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
  },
  companionSprite: { width: 64, height: 64 },
  companionText: { flex: 1 },
  companionKicker: { ...theme.text.label, color: theme.colors.bloodEmber },
  companionName: { ...theme.text.displayS, color: theme.colors.bone },
  companionTitle: { ...theme.text.small, color: theme.colors.boneDim },
  footer: { paddingHorizontal: theme.space[24], paddingTop: theme.space[16], gap: theme.space[8] },
});
