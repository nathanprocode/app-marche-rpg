import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import type { HistoryDay } from "../../features/history/weekHistory";

type WeekChartProps = {
  days: HistoryDay[];
  /** Seuil de pas de la Marque : tracé en ligne de repère. */
  thresholdSteps: number;
};

const PLOT_HEIGHT = 120;
const BAR_MAX_WIDTH = 24;

/**
 * Pas des derniers jours, en barres (une seule série : pas de légende, le titre de la section la nomme).
 * La ligne rouge marque le seuil de la Marque. On touche une barre pour lire le détail du jour.
 */
export function WeekChart({ days, thresholdSteps }: WeekChartProps) {
  const todayIndex = days.findIndex((day) => day.isToday);
  const [selected, setSelected] = useState(todayIndex >= 0 ? todayIndex : days.length - 1);
  // Un peu de marge au-dessus du seuil pour que la ligne ne colle pas au haut du graphique.
  const maxSteps = Math.max(thresholdSteps * 1.2, ...days.map((day) => day.steps));
  const heightOf = (steps: number) => (steps / maxSteps) * PLOT_HEIGHT;
  const day = days[selected];
  // Au-delà d'une semaine, les colonnes sont trop étroites pour un jour chacune : un repère tous les 5 jours.
  const sparseAxis = days.length > 10;

  return (
    <View>
      {/* Légende de la ligne de repère, hors du graphique : posée dessus, une barre finirait par la cacher. */}
      <View style={styles.key} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.keySwatch} />
        <Text style={styles.keyLabel}>{`Seuil de la Marque · ${formatInt(thresholdSteps)} pas`}</Text>
      </View>

      <View style={styles.plot}>
        <View
          pointerEvents="none"
          style={[styles.threshold, { bottom: heightOf(thresholdSteps) }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        {days.map((item, index) => (
          <Pressable
            key={item.dayKey}
            accessibilityRole="button"
            accessibilityLabel={`${item.isToday ? "Aujourd'hui" : `${item.weekday} ${item.dayOfMonth}`} : ${formatDecimal(item.km, 2)} kilomètres, ${formatInt(item.steps)} pas`}
            accessibilityState={{ selected: index === selected }}
            onPress={() => setSelected(index)}
            style={styles.column}
          >
            <View
              style={[
                styles.bar,
                // Jour sans pas : un trait au sol, pour que le jour reste visible.
                { height: Math.max(2, heightOf(item.steps)) },
                index === selected ? styles.barSelected : styles.barIdle,
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.axis} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {days.map((item, index) =>
          sparseAxis ? (
            <View key={item.dayKey} style={styles.sparseCell}>
              {(days.length - 1 - index) % 5 === 0 ? (
                <View style={styles.sparseLabel}>
                  <Text numberOfLines={1} style={[styles.axisLabel, index === selected && styles.axisLabelSelected]}>
                    {item.isToday ? "auj." : item.dayOfMonth}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text key={item.dayKey} style={[styles.axisLabel, index === selected && styles.axisLabelSelected]}>
              {item.isToday ? "auj." : item.weekday}
            </Text>
          ),
        )}
      </View>

      {day ? (
        <Text style={styles.detail}>
          {`${day.isToday ? "Aujourd'hui" : `${day.weekday} ${day.dayOfMonth}`} · ${formatDecimal(day.km, 2)} km · ${formatInt(day.steps)} pas · ${
            day.steps >= thresholdSteps ? "Marque apaisée" : "la Marque a saigné"
          }`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ash,
  },
  column: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  bar: {
    width: "60%",
    maxWidth: BAR_MAX_WIDTH,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barIdle: { backgroundColor: theme.colors.iron },
  barSelected: { backgroundColor: theme.colors.bone },
  threshold: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.bloodEmber,
  },
  key: { flexDirection: "row", alignItems: "center", gap: theme.space[8], marginBottom: theme.space[8] },
  keySwatch: { width: 16, borderTopWidth: 1, borderStyle: "dashed", borderColor: theme.colors.bloodEmber },
  keyLabel: { ...theme.text.label, color: theme.colors.boneDim },
  axis: { flexDirection: "row", marginTop: theme.space[4] },
  axisLabel: { ...theme.text.label, flex: 1, textAlign: "center", color: theme.colors.boneDim },
  sparseCell: { flex: 1, height: 20 },
  sparseLabel: { position: "absolute", top: 0, left: -14, width: 40, alignItems: "center" },
  axisLabelSelected: { color: theme.colors.bone },
  detail: { ...theme.text.small, color: theme.colors.bone, marginTop: theme.space[8] },
});
