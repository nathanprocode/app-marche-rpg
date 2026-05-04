import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { theme } from "../../src/core/theme";

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
};

function TabIcon({ name, color, size, focused }: TabIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const glow = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1.12 : 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: focused ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused, glow, scale]);

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        {
          transform: [{ scale }],
          shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
          shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
        },
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
      {focused ? <View style={styles.dot} /> : null}
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.blood.glow,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.secondary,
          borderTopColor: theme.colors.metal,
          borderTopWidth: 0.5,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? "bonfire" : "bonfire-outline",
            map: focused ? "map" : "map-outline",
            profile: focused ? "person" : "person-outline",
          };

          return <TabIcon name={iconByRoute[route.name] ?? "ellipse" color={color} size={size} focused={focused} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Bivouac" }} />
      <Tabs.Screen name="map" options={{ title: "Carte" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.blood.glow,
    shadowOffset: { width: 0, height: 0 },
  },
  dot: {
    marginTop: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.blood.glow,
  },
});
