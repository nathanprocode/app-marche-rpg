import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS, type Companion } from "../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { isCompanionMet } from "../../features/companions/journey";
import { PaperCard } from "./PaperCard";

type CompanionCollectionProps = {
  unlockedCheckpointIds: string[];
};

function meetingPoint(companion: Companion) {
  return BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === companion.metAtCheckpointId)!;
}

/** Onglet « Compagnons » des Quêtes : les rencontrés en couleur, les autres en silhouette. */
export function CompanionCollection({ unlockedCheckpointIds }: CompanionCollectionProps) {
  const [opened, setOpened] = useState<Companion | null>(null);

  return (
    <>
      <View style={styles.grid}>
        {COMPANIONS.map((companion) =>
          isCompanionMet(companion, unlockedCheckpointIds) ? (
            <Pressable
              key={companion.id}
              accessibilityRole="button"
              accessibilityLabel={`${companion.name}, ${companion.title}. Ouvrir sa fiche`}
              onPress={() => setOpened(companion)}
              style={styles.cell}
            >
              <PaperCard style={styles.card}>
                <Image source={companion.image} style={styles.sprite} resizeMode="contain" />
                <Text style={styles.name}>{companion.name}</Text>
                <Text style={styles.title}>{companion.title}</Text>
              </PaperCard>
            </Pressable>
          ) : (
            <View
              key={companion.id}
              accessible
              accessibilityLabel={`Compagnon inconnu, rencontré à ${formatInt(meetingPoint(companion).kmThreshold)} kilomètres`}
              style={styles.cell}
            >
              <View style={[styles.card, styles.cardLocked]}>
                {/* La silhouette : tintColor repeint tous les pixels opaques du sprite. */}
                <Image
                  source={companion.image}
                  style={[styles.sprite, styles.silhouette]}
                  resizeMode="contain"
                  tintColor={theme.colors.ash}
                />
                <Text style={styles.nameLocked}>Inconnu</Text>
                <Text style={styles.titleLocked}>{`À ${formatInt(meetingPoint(companion).kmThreshold)} km`}</Text>
              </View>
            </View>
          ),
        )}
      </View>

      <Modal visible={opened !== null} transparent animationType="fade" onRequestClose={() => setOpened(null)}>
        <View style={styles.overlay}>
          {opened ? (
            <PaperCard style={styles.sheet}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer la fiche"
                onPress={() => setOpened(null)}
                style={styles.close}
              >
                <Ionicons name="close" size={24} color={theme.colors.ink} />
              </Pressable>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Image
                  source={opened.image}
                  style={styles.sheetSprite}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <Text style={styles.sheetKicker}>
                  {`Première rencontre · ${meetingPoint(opened).title} · ${formatInt(meetingPoint(opened).kmThreshold)} km`}
                </Text>
                <Text accessibilityRole="header" style={styles.sheetName}>
                  {opened.name}
                </Text>
                <Text style={styles.sheetTitle}>{opened.title}</Text>
                <Text style={styles.sheetDescription}>{opened.description}</Text>
              </ScrollView>
            </PaperCard>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space[16] },
  cell: { flexBasis: "45%", flexGrow: 1 },
  // flexGrow : toutes les cartes d'une rangée prennent la hauteur de la plus grande.
  card: { flexGrow: 1, alignItems: "center", paddingVertical: theme.space[16], minHeight: 184 },
  cardLocked: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
    paddingHorizontal: theme.space[8],
  },
  sprite: { width: 88, height: 88 },
  silhouette: { opacity: 0.9 },
  name: { ...theme.text.displayS, color: theme.colors.ink, marginTop: theme.space[8], textAlign: "center" },
  title: { ...theme.text.label, color: theme.colors.blood, textAlign: "center" },
  nameLocked: { ...theme.text.displayS, color: theme.colors.boneDim, marginTop: theme.space[8] },
  titleLocked: { ...theme.text.label, color: theme.colors.boneDim, textAlign: "center" },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: theme.space[24],
    backgroundColor: "rgba(12,10,9,0.92)",
  },
  sheet: { maxHeight: "86%", padding: 0 },
  close: {
    position: "absolute",
    top: theme.space[8],
    right: theme.space[8],
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { alignItems: "center", padding: theme.space[24] },
  sheetSprite: { width: 160, height: 160 },
  sheetKicker: { ...theme.text.label, color: theme.colors.blood, marginTop: theme.space[16], textAlign: "center" },
  sheetName: { ...theme.text.displayL, color: theme.colors.ink, textAlign: "center" },
  sheetTitle: { ...theme.text.bodyStrong, color: theme.colors.umber, textAlign: "center" },
  sheetDescription: { ...theme.text.body, color: theme.colors.ink, marginTop: theme.space[16] },
});
