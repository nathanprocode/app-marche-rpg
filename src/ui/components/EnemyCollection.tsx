import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { ENEMIES, enemyStatus, type Enemy } from "../../data/enemies";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { victoriousEncounterIds } from "../../features/bosses/duel";
import { NextEncounter } from "./NextEncounter";
import { Panel } from "./Panel";

type EnemyCollectionProps = {
  unlockedCheckpointIds: string[];
  /** Distance parcourue dans le tour : pour dire combien il reste avant le prochain ennemi. */
  totalDistanceKm: number;
  /** Victoires de duel (clés « tour/duel »). */
  bossVictories: Record<string, string>;
};

function meetingPoint(enemy: Enemy) {
  return BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === enemy.metAtCheckpointId)!;
}

/** Onglet « Ennemis » de la Collection : les ennemis croisés sur papier, les autres en silhouette dans une case noire. */
export function EnemyCollection({ unlockedCheckpointIds, bossVictories, totalDistanceKm }: EnemyCollectionProps) {
  const [opened, setOpened] = useState<Enemy | null>(null);
  const defeated = victoriousEncounterIds(bossVictories);
  // Le prochain à croiser : le plus proche des ennemis encore inconnus.
  const unknown = ENEMIES.filter((enemy) => enemyStatus(enemy, unlockedCheckpointIds, defeated) === "unknown");
  const nextKm = unknown.length > 0 ? Math.min(...unknown.map((enemy) => meetingPoint(enemy).kmThreshold)) : null;
  const nextEnemies = unknown.filter((enemy) => meetingPoint(enemy).kmThreshold === nextKm);

  return (
    <>
      {nextKm !== null && nextEnemies.length > 0 ? (
        <NextEncounter
          label="prochain ennemi"
          silhouette={
            <Image
              source={nextEnemies[0].forms[0].image}
              style={styles.nextSprite}
              resizeMode="contain"
              tintColor={theme.colors.paperSoft}
              accessibilityIgnoresInvertColors
            />
          }
          kmThreshold={nextKm}
          totalDistanceKm={totalDistanceKm}
          count={nextEnemies.length}
          pluralNoun="ennemis"
        />
      ) : null}
      <View style={styles.grid}>
        {ENEMIES.map((enemy) => {
          const status = enemyStatus(enemy, unlockedCheckpointIds, defeated);
          if (status === "unknown") {
            return (
              <View
                key={enemy.id}
                accessible
                accessibilityLabel={`Ennemi inconnu, croisé à ${formatInt(meetingPoint(enemy).kmThreshold)} kilomètres`}
                style={styles.cell}
              >
                <Panel reversed padded={false} style={styles.card}>
                  {/* La silhouette : tintColor repeint tous les pixels opaques du sprite. */}
                  <Image source={enemy.forms[0].image} style={styles.sprite} resizeMode="contain" tintColor={theme.colors.toneDark} accessibilityIgnoresInvertColors />
                  <Text style={styles.nameLocked}>Inconnu</Text>
                  <Text style={styles.titleLocked}>{`À ${formatInt(meetingPoint(enemy).kmThreshold)} km`}</Text>
                </Panel>
              </View>
            );
          }

          return (
            <Pressable
              key={enemy.id}
              accessibilityRole="button"
              accessibilityLabel={`${enemy.name}, ${enemy.title}, ${status === "defeated" ? "vaincu" : "pas encore vaincu"}. Ouvrir sa fiche`}
              onPress={() => setOpened(enemy)}
              style={styles.cell}
            >
              <Panel padded={false} style={styles.card}>
                <Image source={enemy.forms[0].image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
                <Text style={styles.name}>{enemy.name}</Text>
                <Text style={styles.title}>{enemy.title}</Text>
                <Text style={[styles.badge, status === "defeated" && styles.badgeDone]}>
                  {status === "defeated" ? "Vaincu" : "À vaincre"}
                </Text>
              </Panel>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={opened !== null} transparent animationType="fade" onRequestClose={() => setOpened(null)}>
        <View style={styles.overlay}>
          {opened ? (
            <Panel padded={false} style={styles.sheet}>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer la fiche" onPress={() => setOpened(null)} style={styles.close}>
                <Ionicons name="close" size={24} color={theme.colors.black} />
              </Pressable>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.forms}>
                  {opened.forms.map((form) => (
                    <View key={form.label} style={styles.form}>
                      <Image
                        source={form.image}
                        style={opened.forms.length > 1 ? styles.formSpriteSmall : styles.formSprite}
                        resizeMode="contain"
                        accessibilityLabel={`${opened.name}, ${form.label}`}
                      />
                      {opened.forms.length > 1 ? <Text style={styles.formLabel}>{form.label}</Text> : null}
                    </View>
                  ))}
                </View>
                <Text accessibilityRole="header" style={styles.sheetName}>
                  {opened.name}
                </Text>
                <Text style={styles.sheetTitle}>{opened.title}</Text>
                <Text style={styles.sheetMeta}>
                  {`Première rencontre : « ${meetingPoint(opened).title} », à ${formatInt(meetingPoint(opened).kmThreshold)} km`}
                </Text>
                <Text style={styles.sheetDescription}>{opened.description}</Text>
                <Text style={styles.sheetStatus}>
                  {enemyStatus(opened, unlockedCheckpointIds, defeated) === "defeated"
                    ? "Tu lui as tenu tête."
                    : opened.encounterIds.length > 1
                      ? `Duels à gagner : ${opened.encounterIds.filter((id) => !defeated.includes(id)).length} sur ${opened.encounterIds.length}`
                      : "Duel à gagner"}
                </Text>
              </ScrollView>
            </Panel>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  nextSprite: { width: 72, height: 72 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.gutter },
  cell: { flexBasis: "31%", flexGrow: 1 },
  // flexGrow : toutes les cases d'une rangée prennent la hauteur de la plus haute.
  card: { flexGrow: 1, alignItems: "center", paddingVertical: theme.space[16], paddingHorizontal: theme.space[4], minHeight: 156 },
  name: { ...theme.text.displayS, fontSize: 16, lineHeight: 20, color: theme.colors.black, marginTop: theme.space[8], textAlign: "center" },
  title: { ...theme.text.label, letterSpacing: 0, color: theme.colors.red, textAlign: "center", marginTop: 2 },
  nameLocked: { ...theme.text.displayS, fontSize: 16, lineHeight: 20, color: theme.colors.paperSoft, marginTop: theme.space[8] },
  titleLocked: { ...theme.text.label, letterSpacing: 0, color: theme.colors.paperSoft, textAlign: "center", marginTop: 2 },
  overlay: { flex: 1, justifyContent: "center", padding: theme.space[16], backgroundColor: "rgba(17,17,17,0.94)" },
  sheet: { maxHeight: "86%", padding: 0 },
  // Hors de la zone qui défile : le texte ne passe jamais sous la croix.
  close: {
    alignSelf: "flex-end",
    marginTop: theme.space[8],
    marginRight: theme.space[8],
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { alignItems: "center", padding: theme.space[24], paddingTop: 0 },
  sheetName: { ...theme.text.displayL, color: theme.colors.black, textAlign: "center", marginTop: theme.space[16] },
  sheetTitle: { ...theme.text.bodyStrong, color: theme.colors.blackSoft, textAlign: "center" },
  sheetMeta: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.red, marginTop: theme.space[8], textAlign: "center" },
  sheetDescription: { ...theme.text.body, color: theme.colors.black, marginTop: theme.space[16] },
  sprite: { width: 80, height: 80 },
  badge: { ...theme.text.label, letterSpacing: 0, color: theme.colors.blackSoft, marginTop: theme.space[4] },
  badgeDone: { color: theme.colors.red },
  forms: { flexDirection: "row", gap: theme.space[16], alignItems: "flex-end", justifyContent: "center" },
  form: { alignItems: "center", gap: theme.space[4] },
  formSprite: { width: 180, height: 180 },
  formSpriteSmall: { width: 120, height: 140 },
  formLabel: { ...theme.text.label, letterSpacing: 0, color: theme.colors.blackSoft },
  sheetStatus: { ...theme.text.bodyStrong, color: theme.colors.red, marginTop: theme.space[16], textAlign: "center" },
});
