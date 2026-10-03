import type { ImageSourcePropType } from "react-native";

export type BossPhase = {
  id: string;
  /** Nom de la forme : « Forme humaine », « Forme d'Apôtre »… */
  label: string;
  /** Points de vie de cette forme, en pas. */
  hp: number;
  image: ImageSourcePropType;
};

/** Un duel : il s'ouvre quand on atteint son checkpoint, et chaque pas ensuite fait des dégâts. */
export type BossEncounter = {
  id: string;
  bossName: string;
  /** Titre du duel, au-dessus de la barre de vie. */
  title: string;
  checkpointId: string;
  /** Les formes s'enchaînent dans l'ordre ; la dernière vaincue, le duel est gagné. */
  phases: BossPhase[];
  /** Phrase affichée tant que le duel est en cours. */
  intro: string;
  /** Écran de transition quand on passe à la forme suivante (texte de la forme d'arrivée). */
  phaseChangeTexts: string[];
  victoryTitle: string;
  victoryText: string;
};

const ZODD_HUMAN = require("../../assets/companions/zodd.png");
const ZODD_APOSTLE = require("../../assets/bosses/zodd-apostle.png");

/**
 * Les duels. Les points de vie sont en pas : le premier duel (60 km de route) et le second (48 km) laissent
 * assez de pas pour être gagnés tant que Zodd rôde, mais rien n'est perdu si on ne les gagne pas : le duel continue.
 */
export const BOSS_ENCOUNTERS: BossEncounter[] = [
  {
    id: "zodd-1",
    bossName: "Zodd",
    title: "Duel contre Zodd",
    checkpointId: "cp-004-5",
    phases: [
      { id: "human", label: "Forme humaine", hp: 10_000, image: ZODD_HUMAN },
      { id: "apostle", label: "Forme d'Apôtre", hp: 20_000, image: ZODD_APOSTLE },
    ],
    intro: "Zodd te barre la route. Chaque pas que tu fais l'affaiblit.",
    phaseChangeTexts: [
      "Sa chair se déchire, ses cornes jaillissent : la bête se révèle. Il ne plaisante plus, et toi non plus : continue de marcher.",
    ],
    victoryTitle: "Zodd recule",
    victoryText:
      "Haletant, Zodd s'écarte et te laisse la route, pour cette fois. Tu viens de tenir tête à un monstre que les armées fuient. Les prochains kilomètres te paraîtront légers.",
  },
  {
    id: "zodd-2",
    bossName: "Zodd",
    title: "Revanche de Zodd",
    checkpointId: "cp-011-5",
    phases: [
      { id: "human", label: "Forme humaine", hp: 20_000, image: ZODD_HUMAN },
      { id: "apostle", label: "Forme d'Apôtre", hp: 40_000, image: ZODD_APOSTLE },
    ],
    intro: "Sur la Colline aux Épées, Zodd est revenu. Il est plus fort, toi aussi.",
    phaseChangeTexts: [
      "Le géant ricane et lâche sa forme humaine. La bête surgit, plus massive qu'avant : la colline tremble sous ses pas.",
    ],
    victoryTitle: "Zodd s'incline",
    victoryText:
      "Zodd sourit enfin, de ce sourire sauvage qu'il réserve à ses égaux. Tu as parcouru des centaines de kilomètres pour cet instant : il te reconnaît comme un rival digne de lui.",
  },
];
