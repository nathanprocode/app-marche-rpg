import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { ACHIEVEMENTS, type Achievement, type AchievementStats } from "../../features/achievements/achievements";
import { Panel } from "./Panel";
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
          <Panel
            key={achievement.id}
            reversed={!dateISO}
            style={styles.card}
            accessible
            accessibilityLabel={`${achievement.title}. ${achievement.description} ${status}`}
          >
            <View style={[styles.icon, dateISO ? styles.iconDone : styles.iconLocked]}>
              <Ionicons
                name={(dateISO ? achievement.icon : "lock-closed-outline") as keyof typeof Ionicons.glyphMap}
                size={22}
                color={theme.colors.paper}
              />
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, !dateISO && styles.onBlack]}>{achievement.title}</Text>
              <Text style={dateISO ? styles.small : styles.smallOnBlack}>{achievement.description}</Text>
              {dateISO ? (
                <Text style={styles.date}>{formatUnlockDate(dateISO)}</Text>
              ) : (
                <View style={styles.bar}>
                  <ProgressBar reversed calm pct={pct} accessibilityLabel={`Avancement : ${achievement.title}`} />
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
                <Ionicons name="share-outline" size={22} color={theme.colors.black} />
              </Pressable>
            ) : null}
          </Panel>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  iconDone: { backgroundColor: theme.colors.black },
  iconLocked: { borderWidth: theme.frame, borderColor: theme.colors.toneDark },
  text: { flex: 1, gap: 2 },
  share: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderWidth: theme.frame, borderColor: theme.colors.black },
  title: { ...theme.text.displayS, fontSize: 18, lineHeight: 24, color: theme.colors.black },
  onBlack: { color: theme.colors.paper },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  date: { ...theme.text.small, fontFamily: theme.fontFamily.gothicBold, color: theme.colors.red, marginTop: theme.space[4] },
  bar: { marginTop: theme.space[8] },
});
