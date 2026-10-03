import { Image, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import type { DuelStatus } from "../../features/bosses/duel";
import { InkCard } from "./InkCard";
import { ProgressBar } from "./ProgressBar";

type DuelCardProps = {
  duel: DuelStatus;
};

/** Duel en cours : le boss, sa forme actuelle et ce qu'il lui reste de vie en pas. */
export function DuelCard({ duel }: DuelCardProps) {
  const { encounter, phase, phaseIndex, phaseHp, phaseHpLeft } = duel;
  const isLastForm = phaseIndex === encounter.phases.length - 1;
  const pct = (phaseHpLeft / phaseHp) * 100;
  const left = formatInt(phaseHpLeft);

  return (
    <InkCard
      alert
      style={styles.card}
      accessible
      accessibilityLabel={`${encounter.title}. ${phase.label}. ${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}. ${encounter.intro}`}
    >
      <Image source={phase.image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
      <View style={styles.text}>
        <Text style={styles.kicker}>{`${encounter.title} · forme ${phaseIndex + 1} sur ${encounter.phases.length}`}</Text>
        <Text style={styles.title}>{phase.label}</Text>
        <ProgressBar pct={pct} accessibilityLabel={`Vie de ${encounter.bossName}, ${phase.label}`} height={8} />
        <Text style={styles.small}>{`${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}`}</Text>
        <Text style={styles.intro}>{encounter.intro}</Text>
      </View>
    </InkCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  sprite: { width: 80, height: 96 },
  text: { flex: 1, gap: theme.space[4] },
  kicker: { ...theme.text.label, color: theme.colors.bloodEmber },
  title: { ...theme.text.displayS, color: theme.colors.bone },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  intro: { ...theme.text.small, fontFamily: theme.fontFamily.bodyItalic, color: theme.colors.boneDim, marginTop: theme.space[4] },
});
