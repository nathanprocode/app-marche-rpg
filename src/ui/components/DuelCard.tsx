import { Image, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import type { DuelStatus } from "../../features/bosses/duel";
import { Panel } from "./Panel";
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
  const formLine = encounter.phases.length > 1 ? ` · forme ${phaseIndex + 1} sur ${encounter.phases.length}` : "";

  return (
    <Panel
      style={styles.card}
      accessible
      accessibilityLabel={`Duel : ${encounter.title}. ${phase.label}. ${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}. ${encounter.intro}`}
    >
      <Image source={phase.image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
      <View style={styles.text}>
        <Text style={styles.title}>{phase.label}</Text>
        <Text style={styles.meta}>{`Duel · ${encounter.title}${formLine}`}</Text>
        <View style={styles.bar}>
          <ProgressBar pct={pct} accessibilityLabel={`Vie de ${encounter.bossName}, ${phase.label}`} height={10} />
        </View>
        <Text style={styles.left}>{`${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}`}</Text>
        <Text style={styles.intro}>{encounter.intro}</Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  sprite: { width: 80, height: 96 },
  text: { flex: 1, gap: theme.space[4] },
  title: { ...theme.text.displayS, color: theme.colors.black },
  meta: { ...theme.text.label, letterSpacing: 0, color: theme.colors.red },
  bar: { marginTop: theme.space[4] },
  left: { ...theme.text.bodyStrong, color: theme.colors.black },
  intro: { ...theme.text.small, color: theme.colors.blackSoft },
});
