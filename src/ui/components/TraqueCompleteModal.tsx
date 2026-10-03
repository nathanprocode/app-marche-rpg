import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GAME_CONFIG } from "../../core/constants/game";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS } from "../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { isCompanionMet } from "../../features/companions/journey";
import { shareMessage } from "../../features/share/share";
import { buildFinaleShare } from "../../features/share/shareMessages";
import { isGoalReached } from "../../features/progression/selectors";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useUIStore } from "../../store/useUIStore";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";
import { InkCard } from "./InkCard";

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
  // « Plus tard » ferme jusqu'au prochain démarrage ; le Profil garde le bouton pour repartir.
  const [dismissedLap, setDismissedLap] = useState<number | null>(null);

  const isCheckpointModalOpen = useUIStore((state) => state.isCheckpointModalOpen);
  const visible = enabled && !isCheckpointModalOpen && isGoalReached(progress) && dismissedLap !== progress.lap;

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
            <Text style={styles.kicker}>{`Tour ${progress.lap} · ${formatInt(GAME_CONFIG.totalGoalKm)} km`}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              La Traque est achevée
            </Text>
            <Text style={styles.meta}>{ARRIVAL.title}</Text>
          </View>

          <Text style={styles.description}>{ARRIVAL.description}</Text>

          <InkCard style={styles.stats}>
            <Stat label="Pas depuis le début" value={formatInt(progress.totalSteps)} />
            <Stat label="Meilleure série" value={`${bestStreak} ${bestStreak > 1 ? "jours" : "jour"}`} />
            <Stat label="Compagnons rencontrés" value={`${COMPANIONS.filter((companion) => isCompanionMet(companion, unlockedCheckpoints)).length} / ${COMPANIONS.length}`} />
          </InkCard>

          <Text style={styles.hint}>
            La Marque ne s'efface pas : la route recommence. Tes chroniques, tes compagnons et tes succès restent à toi.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
          <Button label={`Commencer le tour ${progress.lap + 1}`} onPress={() => void startNextLap()} />
          <Button
            label="Partager"
            variant="secondary"
            onPress={() => void shareMessage(buildFinaleShare(progress.totalSteps, bestStreak, progress.lap))}
          />
          <Button label="Plus tard" variant="secondary" onPress={() => setDismissedLap(progress.lap)} />
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
  screen: { flex: 1, backgroundColor: theme.colors.ink },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: theme.colors.bloodGlow, zIndex: 2 },
  content: { paddingHorizontal: theme.space[24], paddingBottom: theme.space[16] },
  header: { alignItems: "center" },
  kicker: { ...theme.text.label, color: theme.colors.bloodEmber, marginTop: theme.space[16], textAlign: "center" },
  title: { ...theme.text.displayL, color: theme.colors.bone, marginTop: theme.space[8], textAlign: "center" },
  meta: { ...theme.text.body, color: theme.colors.boneDim, textAlign: "center" },
  description: {
    ...theme.text.body,
    fontFamily: theme.fontFamily.bodyItalic,
    color: theme.colors.boneDim,
    textAlign: "center",
    marginTop: theme.space[24],
  },
  stats: { marginTop: theme.space[24], gap: theme.space[16] },
  stat: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space[16] },
  label: { ...theme.text.label, color: theme.colors.boneDim, flexShrink: 1 },
  statValue: { ...theme.text.displayS, color: theme.colors.bone },
  hint: { ...theme.text.small, color: theme.colors.boneDim, textAlign: "center", marginTop: theme.space[24] },
  footer: { paddingHorizontal: theme.space[24], paddingTop: theme.space[16], gap: theme.space[8] },
});
