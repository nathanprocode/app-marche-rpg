import { StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  return <View style={[styles.marker, { left: `${xPct * 100}%`, top: `${yPct * 100}%` }]} />;
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: theme.colors.blood.glow,
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
  },
});
