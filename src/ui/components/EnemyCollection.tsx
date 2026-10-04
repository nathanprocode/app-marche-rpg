import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { ENEMIES, enemyStatus, type Enemy } from "../../data/enemies";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { victoriousEncounterIds } from "../../features/bosses/duel";
import { PaperCard } from "./PaperCard";

type EnemyCollectionProps = {
  unlockedCheckpointIds: string[];
  /** Victoires de duel (clés « tour/duel »). */
  bossVictories: Record<string, string>;
};

function meetingPoint(enemy: Enemy) {
  return BERSERK_CHECKPOINTS.find((checkpoint) => checkpoint.id === enemy.metAtCheckpointId)!;
}

/** Onglet « Ennemis » des Quêtes : les ennemis croisés en couleur, les autres en silhouette. */
export function EnemyCollection({ unlockedCheckpointIds, bossVictories }: EnemyCollectionProps) {
  const [opened, setOpened] = useState<Enemy | null>(null);
  const defeated = victoriousEncounterIds(bossVictories);

  return (
    <>
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
                <View style={[styles.card, styles.cardLocked]}>
                  {/* La silhouette : tintColor repeint tous les pixels opaques du sprite. */}
                  <Image source={enemy.forms[0].image} style={styles.sprite} resizeMode="contain" tintColor={theme.colors.ash} accessibilityIgnoresInvertColors />
                  <Text style={styles.nameLocked}>Inconnu</Text>
                  <Text style={styles.titleLocked}>{`À ${formatInt(meetingPoint(enemy).kmThreshold)} km`}</Text>
                </View>
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
              <PaperCard style={styles.card}>
                <Image source={enemy.forms[0].image} style={styles.sprite} resizeMode="contain" accessibilityIgnoresInvertColors />
                <Text style={styles.name}>{enemy.name}</Text>
                <Text style={styles.title}>{enemy.title}</Text>
                <Text style={[styles.badge, status === "defeated" && styles.badgeDone]}>
                  {status === "defeated" ? "Vaincu" : "À vaincre"}
                </Text>
              </PaperCard>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={opened !== null} transparent animationType="fade" onRequestClose={() => setOpened(null)}>
        <View style={styles.overlay}>
          {opened ? (
            <PaperCard style={styles.sheet}>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer la fiche" onPress={() => setOpened(null)} style={styles.close}>
                <Ionicons name="close" size={24} color={theme.colors.ink} />
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
                <Text style={styles.sheetKicker}>
                  {`Première rencontre · ${meetingPoint(opened).title} · ${formatInt(meetingPoint(opened).kmThreshold)} km`}
                </Text>
                <Text accessibilityRole="header" style={styles.sheetName}>
                  {opened.name}
                </Text>
                <Text style={styles.sheetTitle}>{opened.title}</Text>
                <Text style={styles.sheetDescription}>{opened.description}</Text>
                <Text style={styles.sheetStatus}>
                  {enemyStatus(opened, unlockedCheckpointIds, defeated) === "defeated"
                    ? "Tu lui as tenu tête."
                    : opened.encounterIds.length > 1
                      ? `Duels à gagner : ${opened.encounterIds.filter((id) => !defeated.includes(id)).length} sur ${opened.encounterIds.length}`
                      : "Duel à gagner"}
                </Text>
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
  card: { flexGrow: 1, alignItems: "center", paddingVertical: theme.space[16], minHeight: 200 },
  cardLocked: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
    paddingHorizontal: theme.space[8],
  },
  sprite: { width: 96, height: 96 },
  name: { ...theme.text.displayS, color: theme.colors.ink, marginTop: theme.space[8], textAlign: "center" },
  title: { ...theme.text.label, color: theme.colors.blood, textAlign: "center" },
  badge: { ...theme.text.label, color: theme.colors.umber, marginTop: theme.space[4] },
  badgeDone: { color: theme.colors.blood },
  nameLocked: { ...theme.text.displayS, color: theme.colors.boneDim, marginTop: theme.space[8] },
  titleLocked: { ...theme.text.label, color: theme.colors.boneDim, textAlign: "center" },
  overlay: { flex: 1, justifyContent: "center", padding: theme.space[24], backgroundColor: "rgba(12,10,9,0.92)" },
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
  forms: { flexDirection: "row", gap: theme.space[16], alignItems: "flex-end", justifyContent: "center" },
  form: { alignItems: "center", gap: theme.space[4] },
  formSprite: { width: 180, height: 180 },
  formSpriteSmall: { width: 120, height: 140 },
  formLabel: { ...theme.text.label, color: theme.colors.umber },
  sheetKicker: { ...theme.text.label, color: theme.colors.blood, marginTop: theme.space[16], textAlign: "center" },
  sheetName: { ...theme.text.displayL, color: theme.colors.ink, textAlign: "center" },
  sheetTitle: { ...theme.text.bodyStrong, color: theme.colors.umber, textAlign: "center" },
  sheetDescription: { ...theme.text.body, color: theme.colors.ink, marginTop: theme.space[16] },
  sheetStatus: { ...theme.text.label, color: theme.colors.blood, marginTop: theme.space[16], textAlign: "center" },
});
