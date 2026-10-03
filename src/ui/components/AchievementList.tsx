import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { ACHIEVEMENTS, type Achievement, type AchievementStats } from "../../features/achievements/achievements";
import { InkCard } from "./InkCard";
import { ProgressBar } from "./ProgressBar";

type AchievementListProps = {
  stats: AchievementStats;
  /** Succès débloqués : identifiant → date ISO. */
  unlocked: Record<string, string>;
  /** Partage d'un succès débloqué : le bouton n'apparaît que s'il est fourni. */
  onShare?: (achievement: Achievement) => void;
};

const DATE_FORMAT_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Jour et mois écrits en dur : l'Intl de Hermes ne garantit pas les noms français. */
function formatUnlockDate(dateISO: string): string {
  const date = new Date(dateISO);
  return `${date.getDate()} ${DATE_FORMAT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Les succès débloqués d'abord (les plus récents en tête), puis ceux à venir, du plus proche au plus lointain. */
function sortAchievements(unlocked: Record<string, string>, stats: AchievementStats): Achievement[] {
  const done = ACHIEVEMENTS.filter((a) => unlocked[a.id]).sort((a, b) => unlocked[b.id].localeCompare(unlocked[a.id]));
  const todo = ACHIEVEMENTS.filter((a) => !unlocked[a.id]).sort((a, b) => {
    const pa = a.progress(stats);
    const pb = b.progress(stats);
    return pb.value / pb.target - pa.value / pa.target;
  });
  return [...done, ...todo];
}

export function AchievementList({ stats, unlocked, onShare }: AchievementListProps) {
  return (
    <>
      {sortAchievements(unlocked, stats).map((achievement) => {
        const dateISO = unlocked[achievement.id];
        const { value, target } = achievement.progress(stats);
        const pct = Math.min(100, (value / target) * 100);
        const status = dateISO ? `débloqué le ${formatUnlockDate(dateISO)}` : `${formatInt(value)} sur ${formatInt(target)}`;

        return (
          <InkCard
            key={achievement.id}
            style={[styles.card, !dateISO && styles.locked]}
            accessible
            accessibilityLabel={`${achievement.title}. ${achievement.description} ${status}`}
          >
            <View style={[styles.icon, dateISO ? styles.iconDone : styles.iconLocked]}>
              <Ionicons
                name={(dateISO ? achievement.icon : "lock-closed-outline") as keyof typeof Ionicons.glyphMap}
                size={22}
                color={dateISO ? theme.colors.bone : theme.colors.boneDim}
              />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{achievement.title}</Text>
              <Text style={styles.small}>{achievement.description}</Text>
              {dateISO ? (
                <Text style={styles.date}>{formatUnlockDate(dateISO)}</Text>
              ) : (
                <View style={styles.bar}>
                  <ProgressBar pct={pct} accessibilityLabel={`Avancement : ${achievement.title}`} />
                </View>
              )}
            </View>
            {dateISO && onShare ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Partager le succès ${achievement.title}`}
                onPress={() => onShare(achievement)}
                style={styles.share}
              >
                <Ionicons name="share-outline" size={20} color={theme.colors.bone} />
              </Pressable>
            ) : null}
          </InkCard>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  locked: { opacity: 0.85 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1 },
  iconDone: { backgroundColor: theme.colors.blood, borderColor: theme.colors.bloodGlow },
  iconLocked: { borderColor: theme.colors.iron },
  text: { flex: 1 },
  share: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { ...theme.text.bodyStrong, color: theme.colors.bone },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  date: { ...theme.text.label, color: theme.colors.bloodEmber, marginTop: theme.space[4] },
  bar: { marginTop: theme.space[8] },
});
