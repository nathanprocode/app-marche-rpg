import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";
import type { GutsSkin } from "../../data/gutsSkins";

type AppearancePickerProps = {
  skins: GutsSkin[];
  /** Identifiants des skins débloqués. */
  unlockedIds: string[];
  /** Skin porté en ce moment sur la carte. */
  selectedId: string;
  onSelect: (skinId: string) => void;
};

const THUMB_HEIGHT = 72;

/**
 * Section « Apparence » du Profil : les skins de Guts, débloqués en couleur, les autres en silhouette.
 * Tant qu'un seul est débloqué (avant la première Éclipse), il est imposé : rien n'est choisissable.
 */
export function AppearancePicker({ skins, unlockedIds, selectedId, onSelect }: AppearancePickerProps) {
  const canChoose = unlockedIds.length > 1;

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {skins.map((skin) => {
        const unlocked = unlockedIds.includes(skin.id);
        const selected = skin.id === selectedId;
        return (
          <Pressable
            key={skin.id}
            accessibilityRole="radio"
            accessibilityLabel={unlocked ? `${skin.name}. ${skin.description}` : `Apparence verrouillée. ${skin.unlockHint}`}
            accessibilityState={{ selected, disabled: !unlocked || !canChoose }}
            disabled={!unlocked || !canChoose}
            onPress={() => onSelect(skin.id)}
            style={[styles.row, selected && styles.rowSelected, !unlocked && styles.rowLocked]}
          >
            <SkinThumb skin={skin} locked={!unlocked} />
            <View style={styles.text}>
              <Text style={unlocked ? styles.name : styles.nameLocked}>{unlocked ? skin.name : "Verrouillé"}</Text>
              <Text style={styles.small}>{unlocked ? skin.description : skin.unlockHint}</Text>
              {skin.credit && unlocked ? <Text style={styles.credit}>{skin.credit}</Text> : null}
            </View>
            {selected ? <Text style={styles.worn}>Porté</Text> : null}
          </Pressable>
        );
      })}
      {!canChoose ? (
        <Text style={styles.small}>Guts reste jeune jusqu'à l'Éclipse. Ensuite, tu choisiras son apparence ici.</Text>
      ) : null}
    </View>
  );
}

/** Vignette du skin : l'image seule, ou la première image de la planche de marche. */
function SkinThumb({ skin, locked }: { skin: GutsSkin; locked: boolean }) {
  const { sprite } = skin;
  const source = sprite.kind === "sheet" ? sprite.frame : sprite;
  const width = Math.round((source.width / source.height) * THUMB_HEIGHT);
  const sheetWidth = sprite.kind === "sheet" ? width * sprite.frameCount : width;

  return (
    <View style={[styles.thumb, { width }]}>
      <Image
        source={sprite.image}
        resizeMode="stretch"
        tintColor={locked ? theme.colors.ash : undefined}
        accessibilityIgnoresInvertColors
        style={{ width: sheetWidth, height: THUMB_HEIGHT }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space[8] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    padding: theme.space[8],
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
  },
  rowSelected: { borderColor: theme.colors.bone },
  rowLocked: { borderStyle: "dashed", borderColor: theme.colors.iron },
  thumb: { height: THUMB_HEIGHT, overflow: "hidden" },
  text: { flex: 1, gap: theme.space[4] },
  name: { ...theme.text.bodyStrong, color: theme.colors.bone },
  nameLocked: { ...theme.text.bodyStrong, color: theme.colors.boneDim },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  credit: { ...theme.text.small, fontFamily: theme.fontFamily.bodyItalic, color: theme.colors.boneDim },
  worn: { ...theme.text.label, color: theme.colors.bone },
});
