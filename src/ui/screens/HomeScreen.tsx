import { Text, StyleSheet } from "react-native";
import { Screen } from "../components/Screen";
import { SteelCard } from "../components/SteelCard";
import { theme } from "../../core/theme";

export function HomeScreen() {
  return (
    <Screen>
      <SteelCard>
        <Text style={styles.title}>Marche du Faucon</Text>
        <Text style={styles.subtitle}>Objectif: 1000 km</Text>
      </SteelCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xl },
  subtitle: { color: theme.colors.text.muted, marginTop: theme.spacing.sm },
});
