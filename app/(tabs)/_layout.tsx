import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../src/core/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { on: IconName; off: IconName }> = {
  index: { on: "footsteps", off: "footsteps-outline" },
  map: { on: "map", off: "map-outline" },
  quests: { on: "book", off: "book-outline" },
  profile: { on: "person", off: "person-outline" },
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const minimumBottomPadding = Platform.OS === "android" ? 16 : 8;
  const bottomPadding = Math.max(insets.bottom, minimumBottomPadding);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.bloodEmber,
        tabBarInactiveTintColor: theme.colors.boneDim,
        tabBarStyle: {
          backgroundColor: theme.colors.inkRaised,
          borderTopColor: theme.colors.ash,
          borderTopWidth: 1,
          height: 56 + bottomPadding,
          paddingTop: theme.space[8],
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { ...theme.text.label },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = ICONS[route.name] ?? { on: "ellipse", off: "ellipse-outline" };

          return (
            <View style={styles.iconWrap}>
              {focused ? <View style={styles.indicator} /> : null}
              <Ionicons name={focused ? icon.on : icon.off} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Marche" }} />
      <Tabs.Screen name="map" options={{ title: "Carte" }} />
      <Tabs.Screen name="quests" options={{ title: "Quêtes" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  /** Repère de l'onglet actif, au-dessus de l'icône. */
  indicator: {
    position: "absolute",
    top: -theme.space[8] - 2,
    width: 24,
    height: 2,
    backgroundColor: theme.colors.bloodGlow,
  },
});
