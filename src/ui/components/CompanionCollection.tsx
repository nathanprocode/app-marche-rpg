import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { COMPANIONS, type Companion } from "../../data/companions";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { isCompanionMet } from "../../features/companions/journey";
import { CompanionSprite } from "./CompanionSprite";
import { NextEncounter } from "./NextEncounter";
import { Panel } from "./Panel";

type CompanionCollectionProps = {
  unlockedCheckpointIds: string[];
  /** Distance parcourue dans le tour : pour dire combien il reste avant la prochaine rencontre. */
  totalDistanceKm: number;
};

function meetingPoint(companion: Companion) {
  return BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === companion.metAtCheckpointId)!;
}

/** Onglet « Compagnons » de la Collection : les rencontrés sur papier, les autres en silhouette dans une case noire. */
export function CompanionCollection({ unlockedCheckpointIds, totalDistanceKm }: CompanionCollectionProps) {
  const [opened, setOpened] = useState<Companion | null>(null);
  // Le prochain à rencontrer : le plus proche des compagnons encore inconnus (aucun au-delà du premier tour).
  const unmet = COMPANIONS.filter((companion) => !isCompanionMet(companion, unlockedCheckpointIds));
  const nextKm = unmet.length > 0 ? Math.min(...unmet.map((companion) => meetingPoint(companion).kmThreshold)) : null;
  const nextCompanions = unmet.filter((companion) => meetingPoint(companion).kmThreshold === nextKm);

  return (
    <>
      {nextKm !== null && nextCompanions.length > 0 ? (
        <NextEncounter
          label="prochaine rencontre"
          silhouette={<CompanionSprite companion={nextCompanions[0]} size={72} tint={theme.colors.paperSoft} />}
          kmThreshold={nextKm}
          totalDistanceKm={totalDistanceKm}
          count={nextCompanions.length}
          pluralNoun="compagnons"
        />
      ) : null}
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
              <Panel padded={false} style={styles.card}>
                <CompanionSprite companion={companion} size={72} />
                <Text style={styles.name}>{companion.name}</Text>
                <Text style={styles.title}>{companion.title}</Text>
              </Panel>
            </Pressable>
          ) : (
            <View
              key={companion.id}
              accessible
              accessibilityLabel={`Compagnon inconnu, rencontré à ${formatInt(meetingPoint(companion).kmThreshold)} kilomètres`}
              style={styles.cell}
            >
              <Panel reversed padded={false} style={styles.card}>
                {/* La silhouette : tintColor repeint tous les pixels opaques du sprite. */}
                <CompanionSprite companion={companion} size={72} tint={theme.colors.toneDark} />
                <Text style={styles.nameLocked}>Inconnu</Text>
                <Text style={styles.titleLocked}>{`À ${formatInt(meetingPoint(companion).kmThreshold)} km`}</Text>
              </Panel>
            </View>
          ),
        )}
      </View>

      <Modal visible={opened !== null} transparent animationType="fade" onRequestClose={() => setOpened(null)}>
        <View style={styles.overlay}>
          {opened ? (
            <Panel padded={false} style={styles.sheet}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer la fiche"
                onPress={() => setOpened(null)}
                style={styles.close}
              >
                <Ionicons name="close" size={24} color={theme.colors.black} />
              </Pressable>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <CompanionSprite companion={opened} size={160} />
                <Text accessibilityRole="header" style={styles.sheetName}>
                  {opened.name}
                </Text>
                <Text style={styles.sheetTitle}>{opened.title}</Text>
                <Text style={styles.sheetMeta}>
                  {`Première rencontre · ${meetingPoint(opened).title} · ${formatInt(meetingPoint(opened).kmThreshold)} km`}
                </Text>
                <Text style={styles.sheetDescription}>{opened.description}</Text>
              </ScrollView>
            </Panel>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.gutter },
  cell: { flexBasis: "31%", flexGrow: 1 },
  // flexGrow : toutes les cases d'une rangée prennent la hauteur de la plus haute.
  card: { flexGrow: 1, alignItems: "center", paddingVertical: theme.space[16], paddingHorizontal: theme.space[4], minHeight: 156 },
  name: { ...theme.text.displayS, fontSize: 16, lineHeight: 20, color: theme.colors.black, marginTop: theme.space[8], textAlign: "center" },
  title: { ...theme.text.label, letterSpacing: 0, color: theme.colors.blackSoft, textAlign: "center", marginTop: 2 },
  nameLocked: { ...theme.text.displayS, fontSize: 16, lineHeight: 20, color: theme.colors.paperSoft, marginTop: theme.space[8] },
  titleLocked: { ...theme.text.label, letterSpacing: 0, color: theme.colors.paperSoft, textAlign: "center", marginTop: 2 },
  overlay: { flex: 1, justifyContent: "center", padding: theme.space[16], backgroundColor: "rgba(17,17,17,0.94)" },
  sheet: { maxHeight: "86%", padding: 0 },
  close: {
    position: "absolute",
    top: theme.space[8],
    right: theme.space[8],
    zIndex: 2,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { alignItems: "center", padding: theme.space[24] },
  sheetName: { ...theme.text.displayL, color: theme.colors.black, textAlign: "center", marginTop: theme.space[16] },
  sheetTitle: { ...theme.text.bodyStrong, color: theme.colors.blackSoft, textAlign: "center" },
  sheetMeta: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.blackSoft, marginTop: theme.space[8], textAlign: "center" },
  sheetDescription: { ...theme.text.body, color: theme.colors.black, marginTop: theme.space[16] },
});
