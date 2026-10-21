import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../src/core/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { on: IconName; off: IconName }> = {
  index: { on: "footsteps", off: "footsteps-outline" },
  map: { on: "map", off: "map-outline" },
  quests: { on: "albums", off: "albums-outline" },
  band: { on: "people", off: "people-outline" },
  profile: { on: "person", off: "person-outline" },
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const minimumBottomPadding = Platform.OS === "android" ? 12 : 8;
  const bottomPadding = Math.max(insets.bottom, minimumBottomPadding);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        // Changement d'onglet : le nouvel écran glisse à peine en apparaissant (rien si les animations sont coupées).
        animation: reduceMotion ? "none" : "shift",
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.black,
        tabBarInactiveTintColor: theme.colors.blackSoft,
        tabBarStyle: {
          backgroundColor: theme.colors.paper,
          borderTopColor: theme.colors.black,
          borderTopWidth: 3,
          height: 68 + bottomPadding,
          paddingTop: theme.space[8],
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { ...theme.text.label, letterSpacing: 0, marginTop: theme.space[4] },
        tabBarIcon: ({ color, focused }) => {
          const icon = ICONS[route.name] ?? { on: "ellipse", off: "ellipse-outline" };

          // Indicateur Material : une pastille derrière l'icône active, ici encrée et à angles vifs.
          return (
            <View style={[styles.indicator, focused && styles.indicatorOn]}>
              <Ionicons name={focused ? icon.on : icon.off} size={22} color={focused ? theme.colors.paper : color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Marche" }} />
      <Tabs.Screen name="map" options={{ title: "Carte" }} />
      {/* La route garde son nom « quests » : seul le libellé change. */}
      <Tabs.Screen name="quests" options={{ title: "Collection" }} />
      <Tabs.Screen name="band" options={{ title: "Bande" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  indicator: { width: 56, height: 32, alignItems: "center", justifyContent: "center" },
  indicatorOn: { backgroundColor: theme.colors.black },
});
