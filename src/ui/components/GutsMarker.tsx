import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { GutsSkin, GutsSkinSprite } from "../../data/gutsSkins";
import { useWalkStep } from "./useWalkStep";

type GutsMarkerProps = {
  xPct: number;
  yPct: number;
  /** Apparence portée (Guts jeune, Guerrier Noir…), voir src/features/skins. */
  skin: GutsSkin;
};

/** Hauteur affichée sur la carte, quel que soit le skin. */
const SPRITE_HEIGHT = 64;

function spriteWidth(sprite: GutsSkinSprite): number {
  const source = sprite.kind === "sheet" ? sprite.frame : sprite;
  return Math.round((source.width / source.height) * SPRITE_HEIGHT);
}

/**
 * Le Traqué sur la carte, qui marche en boucle. Avec une planche de marche, la planche glisse d'une image à l'autre
 * derrière une fenêtre de la taille d'une image, par sauts francs comme une vraie animation pixel art ; avec une
 * seule image, Guts sautille comme les compagnons. Immobile si « Supprimer les animations » est activé.
 */
export function GutsMarker({ xPct, yPct, skin }: GutsMarkerProps) {
  const width = spriteWidth(skin.sprite);

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel="Position actuelle"
      style={[styles.marker, { left: `${xPct}%`, top: `${yPct}%`, width, marginLeft: -width / 2 }]}
    >
      {skin.sprite.kind === "sheet" ? (
        <WalkSheet key={skin.id} sprite={skin.sprite} width={width} />
      ) : (
        <BouncingSprite key={skin.id} sprite={skin.sprite} width={width} />
      )}
    </View>
  );
}

function WalkSheet({ sprite, width }: { sprite: Extract<GutsSkinSprite, { kind: "sheet" }>; width: number }) {
  const reduceMotion = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      offset.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence(
        Array.from({ length: sprite.frameCount }, (_, frame) => [
          Animated.timing(offset, { toValue: -frame * width, duration: 0, useNativeDriver: true }),
          Animated.delay(sprite.frameMs),
        ]).flat(),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [offset, reduceMotion, sprite.frameCount, sprite.frameMs, width]);

  // La fenêtre ne montre qu'une image de la planche.
  return (
    <View style={{ width, height: SPRITE_HEIGHT, overflow: "hidden" }}>
      <Animated.Image
        source={sprite.image}
        resizeMode="stretch"
        style={{ width: width * sprite.frameCount, height: SPRITE_HEIGHT, transform: [{ translateX: offset }] }}
      />
    </View>
  );
}

function BouncingSprite({ sprite, width }: { sprite: Extract<GutsSkinSprite, { kind: "single" }>; width: number }) {
  const lift = useWalkStep();
  return (
    <Animated.Image
      source={sprite.image}
      resizeMode="stretch"
      style={{ width, height: SPRITE_HEIGHT, transform: [{ translateY: lift }] }}
    />
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    height: SPRITE_HEIGHT,
    marginTop: -SPRITE_HEIGHT - 6,
  },
});
