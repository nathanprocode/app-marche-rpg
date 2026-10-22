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
  /** Décalage horizontal de l'étiquette (px) pour qu'elle reste entière dans l'écran. */
  labelShiftX?: number;
  /**
   * Hauteur de l'étiquette sous le haut du point (px), choisie pour ne pas chevaucher les autres (voir placeLabels) ;
   * null la masque (le point reste). Sans valeur : étiquettes en escalier selon le rang.
   */
  labelOffsetY?: number | null;
};

const LABEL_LANE_WIDTH = 220;
const LABEL_STAGGER = 22;
/** Hauteur de l'étiquette : texte de 20 px, 1 px de marge et 2 px de cadre en haut et en bas. */
export const BAND_LABEL_HEIGHT = 26;
/** Places possibles de l'étiquette sous le haut du point : en escalier dessous, puis au-dessus. */
export const BAND_LABEL_OFFSETS = [14, 14 + LABEL_STAGGER, 14 + 2 * LABEL_STAGGER, -(BAND_LABEL_HEIGHT + 4)];

/** Largeur moyenne d'un caractère de l'étiquette (texte 14 px gras), pour estimer si elle déborde. */
export const BAND_LABEL_CHAR_PX = 8;

/** Le texte affiché sous le point d'un ami. */
export function bandLabel(name: string, lap: number): string {
  return lap > 1 ? `${name} · tour ${lap}` : name;
}

/** Un ami de la Bande sur la carte : un point et son nom, rien d'autre (Guts reste le seul sprite). */
export function BandMarker({ name, xPct, yPct, index, lap, labelShiftX = 0, labelOffsetY }: BandMarkerProps) {
  const label = bandLabel(name, lap);

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel={`${label}, de ta bande`}
      style={[styles.slot, { left: `${xPct}%`, top: `${yPct}%` }]}
    >
      <View style={styles.dot} />
      {labelOffsetY === null ? null : (
        <View style={[styles.lane, { top: labelOffsetY ?? 14 + (index % 3) * LABEL_STAGGER, marginLeft: labelShiftX }]}>
          <View style={styles.chip}>
            <Text numberOfLines={1} style={styles.chipText}>
              {label}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute", width: 12, height: 12, marginLeft: -6, marginTop: -6 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.paper,
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
  },
  // Couloir large centré sur le point : sur Android, une étiquette ne peut pas dépasser son parent sans lui.
  lane: { position: "absolute", left: 6 - LABEL_LANE_WIDTH / 2, width: LABEL_LANE_WIDTH, alignItems: "center" },
  chip: {
    paddingHorizontal: theme.space[8],
    paddingVertical: 1,
    backgroundColor: theme.colors.paper,
    borderWidth: theme.frame,
    borderColor: theme.colors.black,
  },
  chipText: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.black },
});
