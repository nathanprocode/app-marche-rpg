import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { vibrate } from "../../features/haptics/haptics";
import { isCompanionMet } from "../../features/companions/journey";
import { BERSERK_PANEL_IMAGES } from "../../data/map/berserk-panels";
import { buildFinaleCard } from "../../features/share/shareCards";
import { useShareStore } from "../../store/useShareStore";
import { isGoalReached } from "../../features/progression/selectors";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useUIStore } from "../../store/useUIStore";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";

type TraqueCompleteModalProps = {
  enabled: boolean;
};

const ARRIVAL = BERSERK_CHECKPOINTS[BERSERK_CHECKPOINTS.length - 1];

/** Fin de la Traque : s'affiche à l'arrivée des 1 000 km et propose de repartir pour un nouveau tour. */
export function TraqueCompleteModal({ enabled }: TraqueCompleteModalProps) {
  const insets = useSafeAreaInsets();
  const progress = usePlayerStore((state) => state.progress);
  const bestStreak = usePlayerStore((state) => state.bestStreak);
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);
  const startNextLap = usePlayerStore((state) => state.startNextLap);
  const requestShare = useShareStore((state) => state.requestShare);
  // « Plus tard » ferme jusqu'au prochain démarrage ; le Profil garde le bouton pour repartir.
  const [dismissedLap, setDismissedLap] = useState<number | null>(null);

  const isCheckpointModalOpen = useUIStore((state) => state.isCheckpointModalOpen);
  const visible = enabled && !isCheckpointModalOpen && isGoalReached(progress) && dismissedLap !== progress.lap;

  // Une seule vibration à l'apparition de l'écran, pas à chaque rendu.
  useEffect(() => {
    if (visible) vibrate("finale");
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => setDismissedLap(progress.lap)} statusBarTranslucent>
      <View style={styles.screen}>
        <View style={styles.topRule} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space[48] }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandMark visual={{ state: "active", intensity: 0.4 }} width={28} />
            <Text accessibilityRole="header" style={styles.title}>
              La Traque est achevée
            </Text>
            <Text style={styles.meta}>{`${ARRIVAL.title} · tour ${progress.lap} · ${formatInt(GAME_CONFIG.totalGoalKm)} km`}</Text>
          </View>

          <Text style={styles.description}>{ARRIVAL.description}</Text>

          <View style={styles.stats}>
            <Stat label="Pas depuis le début" value={formatInt(progress.totalSteps)} />
            <Stat label="Meilleure série" value={`${bestStreak} ${bestStreak > 1 ? "jours" : "jour"}`} />
            <Stat label="Compagnons rencontrés" value={`${COMPANIONS.filter((companion) => isCompanionMet(companion, unlockedCheckpoints)).length} / ${COMPANIONS.length}`} />
          </View>

          <Text style={styles.hint}>
            La Marque ne s'efface pas : la route recommence. Tes chroniques, tes compagnons et tes succès restent à toi.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
          <Button label={`Commencer le tour ${progress.lap + 1}`} onDark onPress={() => void startNextLap()} />
          <Button
            label="Partager"
            variant="secondary"
            onDark
            onPress={() =>
              requestShare(
                buildFinaleCard(
                  ARRIVAL,
                  { totalSteps: progress.totalSteps, bestStreak, lap: progress.lap },
                  BERSERK_PANEL_IMAGES[ARRIVAL.id],
                ),
              )
            }
          />
          <Button label="Plus tard" variant="secondary" onDark onPress={() => setDismissedLap(progress.lap)} />
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label} : ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.black },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: theme.gutter, backgroundColor: theme.colors.redOnBlack, zIndex: 2 },
  header: { alignItems: "center" },
  title: { ...theme.text.displayL, color: theme.colors.paper, marginTop: theme.space[16], textAlign: "center" },
  meta: { ...theme.text.bodyStrong, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[4] },
  content: { paddingHorizontal: theme.space[16], paddingBottom: theme.space[16] },
  description: { ...theme.text.body, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[24] },
  stats: { marginTop: theme.space[24], padding: theme.space[16], gap: theme.space[16], backgroundColor: theme.colors.paper },
  stat: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space[16] },
  label: { ...theme.text.small, color: theme.colors.blackSoft, flexShrink: 1 },
  statValue: { ...theme.text.displayS, color: theme.colors.black },
  hint: { ...theme.text.small, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[24] },
  footer: { paddingHorizontal: theme.space[16], paddingTop: theme.space[16], gap: theme.space[8] },
});
