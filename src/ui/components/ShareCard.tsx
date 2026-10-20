import { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";
import type { ShareCardData } from "../../features/share/shareCards";
import { BrandMark } from "./BrandMark";

export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 450;

type ShareCardProps = {
  card: ShareCardData;
  /** Appelé quand l'illustration est chargée (ou tout de suite s'il n'y en a pas) : la carte peut être photographiée. */
  onReady: () => void;
};

/** Carte 4:5 « Trame & Encre » : c'est elle qu'on photographie pour le partage, jamais affichée à l'écran. */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard({ card, onReady }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={styles.card}
      onLayout={() => {
        if (!card.image) onReady();
      }}
    >
      <View style={styles.topRule} />
      <View style={styles.header}>
        <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={22} />
        <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.title}>
          {card.title}
        </Text>
        <Text style={styles.kicker}>{card.kicker}</Text>
        {card.subtitle ? (
          <Text numberOfLines={2} style={styles.subtitle}>
            {card.subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.middle}>
        {card.image ? (
          <View style={styles.plate}>
            <Image source={card.image} style={styles.image} resizeMode="cover" onLoadEnd={onReady} />
          </View>
        ) : (
          // Sans illustration, la Marque occupe la place : la carte ne reste pas vide.
          <View style={styles.mark}>
            <BrandMark visual={{ state: "bleeding", intensity: 0.9 }} width={96} />
          </View>
        )}
      </View>

      <View style={styles.stats}>
        {card.stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Marche du Faucon</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.space[24],
    paddingTop: theme.space[24],
    paddingBottom: theme.space[16],
  },
  topRule: { position: "absolute", top: 0, left: 0, right: 0, height: theme.gutter, backgroundColor: theme.colors.redOnBlack },
  header: { alignItems: "center" },
  title: { ...theme.text.displayM, color: theme.colors.paper, marginTop: theme.space[8], textAlign: "center", alignSelf: "stretch" },
  kicker: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.redOnBlack, marginTop: theme.space[4], textAlign: "center" },
  subtitle: { ...theme.text.body, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[4] },
  middle: { flex: 1, minHeight: 0, justifyContent: "center", paddingVertical: theme.space[16] },
  mark: { alignItems: "center" },
  // La case du manga, cadrée de papier.
  plate: { flex: 1, minHeight: 0, backgroundColor: theme.colors.paper, padding: theme.gutter },
  image: { flex: 1, width: "100%" },
  stats: {
    flexDirection: "row",
    gap: theme.space[16],
    paddingTop: theme.space[16],
    borderTopWidth: theme.frame,
    borderTopColor: theme.colors.paper,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { ...theme.text.label, letterSpacing: 0, color: theme.colors.paperSoft, textAlign: "center" },
  statValue: { ...theme.text.displayS, color: theme.colors.paper, textAlign: "center" },
  footer: { ...theme.text.label, color: theme.colors.paperSoft, textAlign: "center", marginTop: theme.space[16] },
});
