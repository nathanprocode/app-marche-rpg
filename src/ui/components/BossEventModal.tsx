import { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../core/theme";
import { BOSS_ENCOUNTERS } from "../../data/bosses";
import { getAchievement } from "../../features/achievements/achievements";
import type { BossEvent } from "../../features/bosses/duel";
import { vibrate } from "../../features/haptics/haptics";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useUIStore } from "../../store/useUIStore";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";

type BossEventModalProps = {
  enabled: boolean;
};

type Screen = { title: string; kicker: string; text: string; image: number; achievementTitle?: string };

function describe(event: BossEvent): Screen | null {
  const encounter = BOSS_ENCOUNTERS.find((item) => item.id === event.encounterId);
  if (!encounter) return null;

  if (event.type === "phase") {
    const phase = encounter.phases[event.phaseIndex];
    return {
      kicker: encounter.title,
      title: `${encounter.bossName} : ${phase.label}`,
      text: encounter.phaseChangeTexts[event.phaseIndex - 1],
      image: phase.image as number,
    };
  }

  const last = encounter.phases[encounter.phases.length - 1];
  return {
    kicker: encounter.title,
    title: encounter.victoryTitle,
    text: encounter.victoryText,
    image: last.image as number,
    achievementTitle: getAchievement(`boss-${encounter.id}`)?.title,
  };
}

/**
 * Écran de duel : changement de forme du boss, puis victoire. Les écrans s'enchaînent un par un
 * et attendent que l'écran « Point franchi » soit fermé, pour ne pas se superposer.
 */
export function BossEventModal({ enabled }: BossEventModalProps) {
  const insets = useSafeAreaInsets();
  const newEvents = usePlayerStore((state) => state.newBossEvents);
  const clearNewBossEvents = usePlayerStore((state) => state.clearNewBossEvents);
  const isCheckpointModalOpen = useUIStore((state) => state.isCheckpointModalOpen);
  const [queue, setQueue] = useState<BossEvent[]>([]);

  useEffect(() => {
    if (!enabled || newEvents.length === 0) return;
    setQueue((current) => [...current, ...newEvents]);
    clearNewBossEvents();
  }, [enabled, newEvents, clearNewBossEvents]);

  const current = queue[0];
  const screen = current && !isCheckpointModalOpen ? describe(current) : null;
  const eventKey = current ? `${current.type}:${current.encounterId}:${current.type === "phase" ? current.phaseIndex : current.lap}` : null;

  useEffect(() => {
    if (!screen || !current) return;
    vibrate(current.type === "victory" ? "finale" : "checkpoint");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une vibration par événement affiché
  }, [eventKey, screen !== null]);

  const dismiss = () => setQueue((items) => items.slice(1));

  return (
    <Modal visible={screen !== null} animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.screen}>
        <View style={styles.topRule} />
        {screen ? (
          <>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space[32] }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={20} />
                <Text style={styles.kicker}>{screen.kicker}</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {screen.title}
                </Text>
              </View>
              <Image source={screen.image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
              <Text style={styles.text}>{screen.text}</Text>
              {screen.achievementTitle ? (
                <View style={styles.reward} accessible accessibilityLabel={`Succès débloqué : ${screen.achievementTitle}`}>
                  <Text style={styles.rewardKicker}>Succès débloqué</Text>
                  <Text style={styles.rewardTitle}>{screen.achievementTitle}</Text>
                </View>
              ) : null}
            </ScrollView>
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
              <Button label="Continuer la marche" onPress={dismiss} />
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
  content: { paddingHorizontal: theme.space[24], paddingBottom: theme.space[16], alignItems: "center" },
  header: { alignItems: "center" },
  kicker: { ...theme.text.label, color: theme.colors.bloodEmber, marginTop: theme.space[16], textAlign: "center" },
  title: { ...theme.text.displayL, color: theme.colors.bone, marginTop: theme.space[8], textAlign: "center" },
  sprite: { width: "100%", height: 280, marginTop: theme.space[24] },
  text: {
    ...theme.text.body,
    fontFamily: theme.fontFamily.bodyItalic,
    color: theme.colors.boneDim,
    textAlign: "center",
    marginTop: theme.space[24],
  },
  reward: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: theme.space[24],
    padding: theme.space[16],
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: theme.colors.bloodGlow,
    borderRadius: theme.radius[4],
  },
  rewardKicker: { ...theme.text.label, color: theme.colors.bloodEmber },
  rewardTitle: { ...theme.text.displayS, color: theme.colors.bone },
  footer: { paddingHorizontal: theme.space[24], paddingTop: theme.space[16] },
});
