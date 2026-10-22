import { useState, type ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { GAME_CONFIG } from "../../core/constants/game";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useUIStore } from "../../store/useUIStore";
import { ArcSilhouette } from "./ArcSilhouette";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";
import { MotionLines } from "./MotionLines";
import { Screentone } from "./Screentone";

type IntroPage = {
  title: string;
  text: string;
  /** La case illustrée en tête de page (une fonction : les styles sont déclarés plus bas). */
  art: () => ReactNode;
};

const PAGES: IntroPage[] = [
  {
    title: "La Traque",
    text: `Chaque pas que tu fais, Guts le fait aussi. ${formatInt(GAME_CONFIG.totalGoalKm)} km à travers l'histoire de Berserk : à chaque point franchi, une case du manga se révèle.`,
    art: () => (
      <View style={[styles.art, styles.artPaper]}>
        <View style={styles.artTrack}>
          <View style={styles.artDone}>
            <Screentone color={theme.colors.tone} step={4} dot={1.3} />
          </View>
          <View style={styles.artAhead}>
            <MotionLines />
          </View>
        </View>
        <Text style={styles.artKm}>
          {formatInt(GAME_CONFIG.totalGoalKm)}
          <Text style={styles.artKmUnit}> km</Text>
        </Text>
      </View>
    ),
  },
  {
    title: "La Marque",
    text: "Chaque jour, la Marque saigne jusqu'à ce que tu atteignes ton objectif de pas. Apaise-la jour après jour : ta série grandit.",
    art: () => (
      <View style={[styles.art, styles.artBlack]}>
        <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={64} />
      </View>
    ),
  },
  {
    title: "Les duels",
    text: "Sur la route, des ennemis te barrent le passage. Leur vie se compte en pas : marche, et ils tombent. Pas de chrono, pas d'échec.",
    art: () => (
      <View style={[styles.art, styles.artPaper]}>
        <ArcSilhouette name="dragonslayer" height={190} color={theme.colors.black} style={styles.artSword} />
      </View>
    ),
  },
];

/**
 * Les règles en trois cases, au premier lancement (puis depuis Réglages, « Comment ça marche »).
 * Se passe d'un appui ; une fois lue ou passée, elle ne revient plus d'elle-même.
 */
export function IntroModal({ enabled }: { enabled: boolean }) {
  const insets = useSafeAreaInsets();
  const isHydrated = useSettingsStore((state) => state.isHydrated);
  const introSeen = useSettingsStore((state) => state.introSeen);
  const setIntroSeen = useSettingsStore((state) => state.setIntroSeen);
  const isReopened = useUIStore((state) => state.isIntroReopened);
  const setIntroReopened = useUIStore((state) => state.setIntroReopened);
  const [pageIndex, setPageIndex] = useState(0);

  const visible = enabled && ((isHydrated && !introSeen) || isReopened);
  const page = PAGES[pageIndex];
  const isLast = pageIndex === PAGES.length - 1;

  function close(): void {
    if (!introSeen) setIntroSeen();
    setIntroReopened(false);
    setPageIndex(0);
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.space[24] }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            {/* Où en est la lecture : une case par page, pleine pour la page ouverte. */}
            <View style={styles.pager} accessible accessibilityLabel={`Page ${pageIndex + 1} sur ${PAGES.length}`}>
              {PAGES.map((item, i) => (
                <View key={item.title} style={[styles.pagerCell, i === pageIndex && styles.pagerCellOn]} />
              ))}
            </View>
            {isLast ? null : <Button label="Passer" variant="text" onDark onPress={close} />}
          </View>

          {page.art()}

          <Text accessibilityRole="header" style={styles.title}>
            {page.title}
          </Text>
          <Text style={styles.text}>{page.text}</Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[16]) + theme.space[16] }]}>
          <Button label={isLast ? "En marche" : "Suivant"} onDark onPress={isLast ? close : () => setPageIndex(pageIndex + 1)} />
          {pageIndex > 0 ? (
            <Button label="Retour" variant="secondary" onDark onPress={() => setPageIndex(pageIndex - 1)} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.black },
  content: { paddingHorizontal: theme.space[16], paddingBottom: theme.space[16], gap: theme.space[16] },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 },
  pager: { flexDirection: "row", gap: theme.space[8] },
  pagerCell: { width: 16, height: 16, borderWidth: theme.frame, borderColor: theme.colors.paper },
  pagerCellOn: { backgroundColor: theme.colors.paper },
  // La case illustrée : papier ou encre, cadrée comme une case de la planche.
  art: { height: 220, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  artPaper: { backgroundColor: theme.colors.paper },
  artBlack: { borderWidth: theme.frame, borderColor: theme.colors.toneDark },
  artTrack: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  artDone: { width: "18%" },
  artAhead: { flex: 1 },
  artKm: { ...theme.text.displayXl, color: theme.colors.black },
  artKmUnit: { ...theme.text.displayM, letterSpacing: 0 },
  artSword: { transform: [{ rotate: "32deg" }] },
  title: { ...theme.text.displayL, color: theme.colors.paper },
  text: { ...theme.text.body, color: theme.colors.paperSoft },
  footer: {
    paddingHorizontal: theme.space[16],
    paddingTop: theme.space[16],
    gap: theme.space[8],
    borderTopWidth: theme.frame,
    borderTopColor: theme.colors.toneDark,
  },
});
