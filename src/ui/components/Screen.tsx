import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../core/theme";

type ScreenProps = { children: ReactNode };

export function Screen({ children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg.primary },
  body: { flex: 1, padding: theme.spacing.lg },
});
