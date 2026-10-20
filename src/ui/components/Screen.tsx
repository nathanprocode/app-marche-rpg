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
  /**
   * « page » : une planche noire où les enfants sont des cases (Panel) séparées par la gouttière.
   * « legacy » : l'ancienne mise en page, le temps de migrer l'écran.
   */
  variant?: "page" | "legacy";
};

export function Screen({ children, scroll = false, edges = ["top"], variant = "legacy" }: ScreenProps) {
  const isPage = variant === "page";
  const contentStyle = isPage ? styles.pageContent : styles.legacyContent;

  return (
    <SafeAreaView style={[styles.safe, isPage && styles.page]} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  page: { backgroundColor: theme.colors.black },
  body: { flex: 1 },
  pageContent: { padding: theme.gutter, gap: theme.gutter },
  legacyContent: {
    paddingHorizontal: theme.space[24],
    paddingTop: theme.space[16],
    paddingBottom: theme.space[32],
  },
});
