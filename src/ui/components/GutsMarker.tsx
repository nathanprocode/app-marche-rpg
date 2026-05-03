import { Image, StyleSheet, View } from "react-native";
import { theme } from "../../core/theme";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
};

const gutsMarkerAsset = require("../../../assets/map/guts-marker.png");

export function GutsMarker({ xPct, yPct }: GutsMarkerProps) {
  return (
    <View style={[styles.marker, { left: `${xPct * 100}%`, top: `${yPct * 100}%` }]}>
      <Image source={gutsMarkerAsset} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.blood.glow,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
