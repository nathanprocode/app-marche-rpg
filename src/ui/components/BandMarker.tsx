import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";

type BandMarkerProps = {
  name: string;
  /** Position sur la carte, en %. */
  xPct: number;
  yPct: number;
  /** Rang parmi les amis : décale l'étiquette vers le bas pour que deux amis proches ne se recouvrent pas. */
  index: number;
  /** Tour de Traque, affiché seulement à partir du deuxième. */
  lap: number;
};

const LABEL_LANE_WIDTH = 220;
const LABEL_STAGGER = 22;

/** Un ami de la Bande sur la carte : un point et son nom, rien d'autre (Guts reste le seul sprite). */
export function BandMarker({ name, xPct, yPct, index, lap }: BandMarkerProps) {
  const label = lap > 1 ? `${name} · tour ${lap}` : name;

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel={`${label}, de ta bande`}
      style={[styles.slot, { left: `${xPct}%`, top: `${yPct}%` }]}
    >
      <View style={styles.dot} />
      <View style={[styles.lane, { top: 14 + (index % 3) * LABEL_STAGGER }]}>
        <View style={styles.chip}>
          <Text numberOfLines={1} style={styles.chipText}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute", width: 12, height: 12, marginLeft: -6, marginTop: -6 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.bone,
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  // Couloir large centré sur le point : sur Android, une étiquette ne peut pas dépasser son parent sans lui.
  lane: { position: "absolute", left: 6 - LABEL_LANE_WIDTH / 2, width: LABEL_LANE_WIDTH, alignItems: "center" },
  chip: {
    paddingHorizontal: theme.space[8],
    paddingVertical: 1,
    backgroundColor: "rgba(12,10,9,0.88)",
    borderWidth: 1,
    borderColor: theme.colors.iron,
  },
  chipText: { ...theme.text.small, color: theme.colors.bone },
});
