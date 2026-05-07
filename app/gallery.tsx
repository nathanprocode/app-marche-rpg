import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BERSERK_CHECKPOINTS } from "../src/data/map/berserk-checkpoints";
import { BERSERK_PANEL_IMAGES } from "../src/data/map/berserk-panels";
import { theme } from "../src/core/theme";
import { usePlayerStore } from "../src/store/usePlayerStore";

export default function GalleryScreen() {
  const router = useRouter();
  const unlockedCheckpoints = usePlayerStore((state) => state.unlockedCheckpoints);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Succès</Text>
            <Text style={styles.title}>Galerie des Souvenirs</Text>
          </View>
        </View>

        {BERSERK_CHECKPOINTS.map((checkpoint) => {
          const isUnlocked = unlockedCheckpoints.includes(checkpoint.id);
          const panelImage = BERSERK_PANEL_IMAGES[checkpoint.id];

          return (
            <View key={checkpoint.id} style={[styles.card, !isUnlocked && styles.lockedCard]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.arc, !isUnlocked && styles.lockedText]}>{isUnlocked ? checkpoint.arc : "???"}</Text>
                  <Text style={[styles.cardTitle, !isUnlocked && styles.lockedTitle]}>
                    {isUnlocked ? checkpoint.title : "Souvenir verrouillé"}
                  </Text>
                </View>
                {!isUnlocked && <Ionicons name="lock-closed" size={22} color={theme.colors.text.muted} />}
              </View>

              {isUnlocked && panelImage ? (
                <Image source={panelImage} style={styles.panelImage} resizeMode="cover" />
              ) : (
                <View style={styles.lockedPanel}>
                  <Ionicons name="lock-closed" size={34} color={theme.colors.metal} />
                </View>
              )}

              <Text style={[styles.description, !isUnlocked && styles.lockedText]}>
                {isUnlocked ? checkpoint.description : "???"}
              </Text>
              {!isUnlocked && (
                <Text style={styles.requirement}>{checkpoint.kmThreshold.toFixed(0)} km requis pour débloquer</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.metal,
    backgroundColor: theme.colors.bg.secondary,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: theme.colors.blood.glow,
    fontSize: theme.typography.size.sm,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xl,
    fontWeight: "700",
    marginTop: theme.spacing.xs,
  },
  card: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(193,18,31,0.48)",
    backgroundColor: theme.colors.bg.secondary,
    overflow: "hidden",
  },
  lockedCard: {
    borderColor: "rgba(94,100,114,0.45)",
    opacity: 0.86,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  arc: {
    color: theme.colors.blood.glow,
    fontSize: theme.typography.size.sm,
    fontWeight: "700",
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    fontWeight: "700",
    marginTop: theme.spacing.xs,
  },
  panelImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#050506",
  },
  lockedPanel: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  description: {
    color: theme.colors.text.muted,
    lineHeight: 20,
    padding: theme.spacing.md,
  },
  lockedText: {
    color: theme.colors.text.muted,
  },
  lockedTitle: {
    color: theme.colors.metal,
  },
  requirement: {
    color: theme.colors.text.primary,
    fontWeight: "700",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
