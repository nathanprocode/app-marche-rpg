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
  const formLine =
    encounter.phases.length > 1 ? `${phase.label} (${phaseIndex + 1} sur ${encounter.phases.length})` : phase.label;
  // « Duel contre Zodd » redit le nom du boss ; « Revanche de Zodd » ou « L'Éclipse : Void » apprennent quelque chose.
  const context = encounter.title.startsWith("Duel contre") ? null : encounter.title;

  return (
    <Panel
      reversed
      style={styles.card}
      accessible
      accessibilityLabel={`Duel : ${encounter.title}. ${phase.label}. ${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}. ${encounter.intro}`}
    >
      {/* Case de papier : les boss sombres (Zodd en Apôtre, Void) disparaîtraient sur le fond noir. */}
      <View style={styles.plate}>
        <Image source={phase.image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.text}>
        {context ? <Text style={styles.context}>{context}</Text> : null}
        <Text style={styles.title}>{encounter.bossName}</Text>
        <Text style={styles.meta}>{formLine}</Text>
        <View style={styles.bar}>
          <ProgressBar reversed pct={pct} accessibilityLabel={`Vie de ${encounter.bossName}, ${phase.label}`} height={10} />
        </View>
        <Text style={styles.left}>{`${left} pas avant ${isLastForm ? "la victoire" : "sa prochaine forme"}`}</Text>
        <Text style={styles.intro}>{encounter.intro}</Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  plate: { backgroundColor: theme.colors.paper, padding: theme.space[4] },
  sprite: { width: 80, height: 96 },
  text: { flex: 1, gap: theme.space[4] },
  context: { ...theme.text.small, color: theme.colors.paperSoft },
  title: { ...theme.text.displayS, color: theme.colors.paper },
  meta: { ...theme.text.label, letterSpacing: 0, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.redOnBlack },
  bar: { marginTop: theme.space[4] },
  left: { ...theme.text.bodyStrong, color: theme.colors.paper },
  intro: { ...theme.text.small, color: theme.colors.paperSoft },
});
