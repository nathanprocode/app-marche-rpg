import { Platform, Vibration } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";

/** Les moments qui font vibrer le téléphone : des événements rares, jamais pendant la marche. */
export type HapticKind = "calm" | "achievement" | "checkpoint" | "finale";

/** Motifs Android : pause, puis alternance vibration / pause, en millisecondes. */
const PATTERNS: Record<HapticKind, number[]> = {
  /** Objectif du jour atteint : une pulsation, comme un souffle qui se détend. */
  calm: [0, 60],
  achievement: [0, 40, 70, 40],
  /** Point franchi : un coup sourd puis deux plus brefs, comme un battement de cœur. */
  checkpoint: [0, 90, 110, 40, 70, 40],
  finale: [0, 70, 90, 70, 90, 70, 160, 220],
};

export function patternFor(kind: HapticKind): number[] {
  return PATTERNS[kind];
}

/** Fait vibrer si l'option est activée dans le Profil (désactivée par défaut). Sans effet sur le web. */
export function vibrate(kind: HapticKind): void {
  if (Platform.OS === "web" || !useSettingsStore.getState().hapticsEnabled) return;

  try {
    Vibration.vibrate(PATTERNS[kind]);
  } catch (error) {
    console.log("[Haptics] unavailable", error);
  }
}
