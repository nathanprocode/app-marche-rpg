import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { theme } from "../../core/theme";

type ScreenProps = {
  children: ReactNode;
  /** Contenu défilant (écrans plus hauts que le téléphone). */
  scroll?: boolean;
  /** Bords protégés par la zone sûre. Les onglets gèrent déjà le bas. */
  edges?: Edge[];
};

export function Screen({ children, scroll = false, edges = ["top"] }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.ink },
  body: { flex: 1, paddingHorizontal: theme.space[24], paddingTop: theme.space[16] },
  scrollContent: {
    paddingHorizontal: theme.space[24],
    paddingTop: theme.space[16],
    paddingBottom: theme.space[32],
  },
});
