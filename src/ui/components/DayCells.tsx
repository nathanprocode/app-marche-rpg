import { StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { theme } from "../../core/theme";
import type { HistoryDay } from "../../features/history/weekHistory";

const CELL = 36;

type DayCellsProps = {
  /** Les derniers jours, du plus ancien à aujourd'hui (voir lastDays). */
  days: HistoryDay[];
  /** Jours connus de l'historique de ce téléphone : un jour absent n'est ni tenu ni manqué, juste inconnu. */
  recordedDayKeys: ReadonlySet<string>;
  thresholdSteps: number;
  /** Cases posées dans une case inversée (fond noir). */
  reversed?: boolean;
};

/**
 * Les jours en cases : pleine quand l'objectif est tenu, barrée quand il a été manqué,
 * en pointillés pour aujourd'hui tant qu'il n'est pas atteint, vide quand le téléphone n'en sait rien.
 */
export function DayCells({ days, thresholdSteps, recordedDayKeys, reversed = false }: DayCellsProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const held = day.steps >= thresholdSteps;
        const missed = !held && !day.isToday && recordedDayKeys.has(day.dayKey);
        const status = held ? "objectif tenu" : missed ? "objectif manqué" : day.isToday ? "en cours" : "pas de données";

        return (
          <View
            key={day.dayKey}
            accessible
            accessibilityLabel={`${day.weekday} ${day.dayOfMonth} : ${status}`}
            style={[
              styles.cell,
              reversed && styles.cellReversed,
              held && (reversed ? styles.heldReversed : styles.held),
              day.isToday && !held && styles.today,
              !held && !missed && !day.isToday && styles.unknown,
            ]}
          >
            {missed ? (
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 10 10" preserveAspectRatio="none">
                <Line x1={0} y1={10} x2={10} y2={0} stroke={reversed ? theme.colors.redOnBlack : theme.colors.red} strokeWidth={0.6} />
              </Svg>
            ) : null}
            <Text style={[styles.letter, reversed && styles.letterReversed, held && (reversed ? styles.letterHeldReversed : styles.letterHeld)]}>{day.weekday.charAt(0).toUpperCase()}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.space[4] },
  cell: {
    width: CELL,
    height: CELL,
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cellReversed: { borderColor: theme.colors.paper },
  held: { backgroundColor: theme.colors.black },
  heldReversed: { backgroundColor: theme.colors.paper },
  today: { borderStyle: "dashed" },
  unknown: { opacity: 0.4 },
  letter: { ...theme.text.label, letterSpacing: 0, color: theme.colors.black },
  letterHeld: { color: theme.colors.paper },
  letterReversed: { color: theme.colors.paper },
  letterHeldReversed: { color: theme.colors.black },
});
