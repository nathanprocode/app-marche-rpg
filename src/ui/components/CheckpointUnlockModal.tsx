import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../core/theme";
import { formatInt } from "../../core/format";
import { BERSERK_CHECKPOINTS, type BerserkCheckpoint } from "../../data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { usePlayerStore } from "../../store/usePlayerStore";
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
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
              <Button label="Continuer la marche" onPress={dismiss} />
              <Button label="Voir sur la carte" variant="secondary" onPress={showOnMap} />
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
  footer: { paddingHorizontal: theme.space[24], paddingTop: theme.space[16], gap: theme.space[8] },
});
