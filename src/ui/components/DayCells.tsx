import { StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { theme } from "../../core/theme";
import type { HistoryDay } from "../../features/history/weekHistory";

const CELL = 36;

type DayCellsProps = {
  /** Les derniers jours, du plus ancien à aujourd'hui (voir lastDays). */
  days: HistoryDay[];
  thresholdSteps: number;
};

/**
 * Les jours en cases : pleine quand l'objectif est tenu, barrée quand il a été manqué,
 * creuse (en pointillés) pour aujourd'hui tant qu'il n'est pas atteint.
 */
export function DayCells({ days, thresholdSteps }: DayCellsProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const held = day.steps >= thresholdSteps;
        const missed = !held && !day.isToday;
        const status = held ? "objectif tenu" : missed ? "objectif manqué" : "en cours";

        return (
          <View
            key={day.dayKey}
            accessible
            accessibilityLabel={`${day.weekday} ${day.dayOfMonth} : ${status}`}
            style={[styles.cell, held && styles.held, day.isToday && !held && styles.today]}
          >
            {missed ? (
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 10 10" preserveAspectRatio="none">
                <Line x1={0} y1={10} x2={10} y2={0} stroke={theme.colors.red} strokeWidth={0.6} />
              </Svg>
            ) : null}
            <Text style={[styles.letter, held && styles.letterHeld]}>{day.weekday.charAt(0).toUpperCase()}</Text>
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
  held: { backgroundColor: theme.colors.black },
  today: { borderStyle: "dashed" },
  letter: { ...theme.text.label, letterSpacing: 0, color: theme.colors.black },
  letterHeld: { color: theme.colors.paper },
});
