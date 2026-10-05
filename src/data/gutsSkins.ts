import type { ImageSourcePropType } from "react-native";

/** Ce qu'il faut pour débloquer un skin. */
export type GutsSkinUnlock =
  | { type: "always" }
  /** Atteindre ce checkpoint au moins une fois (dans n'importe quel tour de Traque). */
  | { type: "checkpoint"; checkpointId: string };

/** Comment Guts est dessiné sur la carte. */
export type GutsSkinSprite =
  /** Planche de marche : `frameCount` images de `frame` px côte à côte, qui défilent. */
  | { kind: "sheet"; image: ImageSourcePropType; frameCount: number; frame: { width: number; height: number } }
  /** Une seule image, qui marche par un simple rebond (en attendant une planche de marche). */
  | { kind: "single"; image: ImageSourcePropType; width: number; height: number };

export type GutsSkin = {
  id: string;
  name: string;
  description: string;
  unlock: GutsSkinUnlock;
  /** Phrase affichée tant que le skin est verrouillé. */
  unlockHint: string;
  sprite: GutsSkinSprite;
  /** Crédit de l'artiste, affiché dans la section Apparence du Profil. */
  credit?: string;
};

/**
 * Les skins de Guts sur la carte, dans l'ordre de l'histoire. Par défaut, c'est le dernier débloqué qui est porté :
 * Guts jeune jusqu'à l'Éclipse, puis le Guerrier Noir. Pour en ajouter un : une entrée ici, avec son sprite.
 */
export const GUTS_SKINS: GutsSkin[] = [
  {
    id: "young",
    name: "Guts de la Troupe du Faucon",
    description: "Le mercenaire de l'Âge d'Or, avant l'Éclipse.",
    unlock: { type: "always" },
    unlockHint: "Disponible dès le départ.",
    // Une seule image (pixel art agrandi x2, détouré, signature retirée) en attendant les 8 images de marche.
    sprite: { kind: "single", image: require("../../assets/map/guts-jeune.png"), width: 128, height: 204 },
    credit: "Dessin de @CRYBAG",
  },
  {
    id: "black-swordsman",
    name: "Le Guerrier Noir",
    description: "Guts après l'Éclipse, la Marque dans le cou et la Dragon Slayer sur le dos.",
    unlock: { type: "checkpoint", checkpointId: "cp-008" },
    unlockHint: "Se débloque à l'Éclipse (315 km).",
    sprite: {
      kind: "sheet",
      image: require("../../assets/map/guts-walk.png"),
      frameCount: 8,
      frame: { width: 124, height: 131 },
    },
  },
];
