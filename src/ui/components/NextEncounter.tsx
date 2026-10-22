import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDecimal, formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { Panel } from "./Panel";

type NextEncounterProps = {
  /** « prochaine rencontre », « prochain ennemi »… (en minuscules : il suit la distance). */
  label: string;
  /** La silhouette du prochain (sans nom : la rencontre garde sa surprise). */
  silhouette: ReactNode;
  /** Distance du point où il se révèle, sur la Traque. */
  kmThreshold: number;
  /** Distance déjà parcourue dans le tour. */
  totalDistanceKm: number;
  /** Combien se révèlent à ce même point (1 le plus souvent). */
  count: number;
  /** « compagnons », « ennemis » : pour dire « 3 compagnons à ce point ». */
  pluralNoun: string;
};

/** En tête d'une collection : le prochain à se révéler, et la distance qu'il reste à marcher pour le croiser. */
export function NextEncounter({ label, silhouette, kmThreshold, totalDistanceKm, count, pluralNoun }: NextEncounterProps) {
  const remainingKm = Math.max(0, kmThreshold - totalDistanceKm);

  return (
    <Panel
      reversed
      style={styles.panel}
      accessible
      accessibilityLabel={`${label} : à ${formatInt(kmThreshold)} kilomètres, encore ${formatDecimal(remainingKm)} kilomètres${count > 1 ? `, ${count} ${pluralNoun}` : ""}`}
    >
      <View style={styles.silhouette}>{silhouette}</View>
      <View style={styles.text}>
        <Text style={styles.km}>{`À ${formatInt(kmThreshold)} km`}</Text>
        <Text style={styles.small}>
          {`${label} · encore ${formatDecimal(remainingKm)} km${count > 1 ? ` · ${count} ${pluralNoun} à ce point` : ""}`}
        </Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  silhouette: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  km: { ...theme.text.displayM, color: theme.colors.paper },
  small: { ...theme.text.small, color: theme.colors.paperSoft },
});
