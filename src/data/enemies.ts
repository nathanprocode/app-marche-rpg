import type { ImageSourcePropType } from "react-native";

export type EnemyForm = { label: string; image: ImageSourcePropType };

export type Enemy = {
  id: string;
  name: string;
  title: string;
  description: string;
  /** Une ou plusieurs formes ; la première sert d'image de la carte. Pixel art, fond transparent, 192 px de haut. */
  forms: EnemyForm[];
  /** Checkpoint où on le rencontre : il entre alors dans le bestiaire. */
  metAtCheckpointId: string;
  /** Duels (src/data/bosses.ts) qui l'opposent à Guts : l'ennemi est « vaincu » quand tous sont gagnés. */
  encounterIds: string[];
};

/** Le bestiaire, dans l'ordre où on les croise sur la route. */
export const ENEMIES: Enemy[] = [
  {
    id: "zodd",
    name: "Zodd",
    title: "L'Immortel",
    description:
      "Apôtre plus ancien que les légendes, Zodd ne cherche ni gloire ni vengeance : seulement des adversaires dignes de lui. Tu le croiseras deux fois sur la route, et il reviendra plus fort chaque fois que tu l'auras fait reculer.",
    forms: [
      { label: "Forme humaine", image: require("../../assets/companions/zodd.png") },
      { label: "Forme d'Apôtre", image: require("../../assets/bosses/zodd-apostle.png") },
    ],
    metAtCheckpointId: "cp-004-5",
    encounterIds: ["zodd-1", "zodd-2"],
  },
  {
    id: "void",
    name: "Void",
    title: "Le Vide",
    description:
      "Le plus ancien des cinq de la Main de Dieu, celui qui préside le rite de l'Éclipse. Son regard ne laisse rien paraître : on n'a jamais su ce qu'il voulait, seulement ce qu'il permettait.",
    forms: [{ label: "Main de Dieu", image: require("../../assets/bosses/void.png") }],
    metAtCheckpointId: "cp-008",
    encounterIds: ["void"],
  },
  {
    id: "ubik",
    name: "Ubik",
    title: "Le Rieur",
    description:
      "Un petit être au visage rond, dont le rire résonne quand le sang coule. Ne te fie pas à sa taille : dans la Main de Dieu, nul n'est inoffensif.",
    forms: [{ label: "Main de Dieu", image: require("../../assets/bosses/ubik.png") }],
    metAtCheckpointId: "cp-008",
    encounterIds: ["ubik"],
  },
  {
    id: "conrad",
    name: "Conrad",
    title: "Le Colosse",
    description:
      "Massif et lent, Conrad avance sans hâte, certain que rien ne lui échappera. Sa patience est son arme : il t'oppose le temps, auquel tu ne peux répondre que par la marche.",
    forms: [{ label: "Main de Dieu", image: require("../../assets/bosses/conrad.png") }],
    metAtCheckpointId: "cp-008",
    encounterIds: ["conrad"],
  },
  {
    id: "slan",
    name: "Slan",
    title: "La Tentatrice",
    description:
      "Elle sourit, elle observe, elle attend que tu faiblisses. Pour Slan, les hommes ne sont que des jeux, et elle déteste qu'on ne lui cède pas.",
    forms: [{ label: "Main de Dieu", image: require("../../assets/bosses/slan.png") }],
    metAtCheckpointId: "cp-008",
    encounterIds: ["slan"],
  },
  {
    id: "femto",
    name: "Femto",
    title: "Le Faucon Déchu",
    description:
      "Griffith, devenu le cinquième de la Main de Dieu après avoir sacrifié la Troupe du Faucon. Celui que tu suivais, et que tu dois maintenant affronter. Il se souvient de tout, et c'est ce qui rend ce duel si lourd.",
    forms: [{ label: "Main de Dieu", image: require("../../assets/bosses/femto.png") }],
    metAtCheckpointId: "cp-008",
    encounterIds: ["femto"],
  },
];

export type EnemyStatus = "unknown" | "met" | "defeated";

/** Inconnu tant que son checkpoint n'est pas franchi ; vaincu quand tous ses duels ont été gagnés (tous tours confondus). */
export function enemyStatus(enemy: Enemy, unlockedCheckpointIds: string[], defeatedEncounterIds: string[]): EnemyStatus {
  if (!unlockedCheckpointIds.includes(enemy.metAtCheckpointId)) return "unknown";
  return enemy.encounterIds.every((id) => defeatedEncounterIds.includes(id)) ? "defeated" : "met";
}
