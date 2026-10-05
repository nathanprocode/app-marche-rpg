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
  /**
   * Duel qu'il faut gagner avant : celui-ci s'ouvre quand l'autre se termine, au lieu de s'ouvrir au checkpoint
   * (les cinq de la Main de Dieu se succèdent à l'Éclipse).
   */
  afterEncounterId?: string;
  /** Les formes s'enchaînent dans l'ordre ; la dernière vaincue, le duel est gagné. */
  phases: BossPhase[];
  /** Phrase affichée tant que le duel est en cours. */
  intro: string;
  /** Écran de transition quand on passe à la forme suivante (texte de la forme d'arrivée). */
  phaseChangeTexts: string[];
  victoryTitle: string;
  victoryText: string;
};

const BAZUSO = require("../../assets/bosses/bazuso.png");
const ZODD_HUMAN = require("../../assets/companions/zodd.png");
const ZODD_APOSTLE = require("../../assets/bosses/zodd-apostle.png");
const VOID = require("../../assets/bosses/void.png");
const UBIK = require("../../assets/bosses/ubik.png");
const CONRAD = require("../../assets/bosses/conrad.png");
const SLAN = require("../../assets/bosses/slan.png");
const FEMTO = require("../../assets/bosses/femto.png");

/**
 * Les duels. Les points de vie sont en pas : le premier duel (60 km de route) et le second (48 km) laissent
 * assez de pas pour être gagnés tant que Zodd rôde, mais rien n'est perdu si on ne les gagne pas : le duel continue.
 */
export const BOSS_ENCOUNTERS: BossEncounter[] = [
  // Premier duel de la route : entre « Le Briseur d'Ours » (52 km) et « La Rencontre avec le Faucon » (85 km) il y a
  // environ 44 000 pas, Bazuso n'en demande que 8 000.
  {
    id: "bazuso",
    bossName: "Bazuso",
    title: "Duel contre Bazuso",
    checkpointId: "cp-003",
    phases: [{ id: "base", label: "Le Tueur de Cent Hommes", hp: 8_000, image: BAZUSO }],
    intro: "Bazuso s'avance seul devant son armée, sa hache sur l'épaule. Il rit de toi. Chaque pas que tu fais lui donne tort.",
    phaseChangeTexts: [],
    victoryTitle: "Bazuso est tombé",
    victoryText:
      "Le colosse en armure s'effondre dans la boue, et les deux armées se taisent. Personne n'y croyait. Désormais, c'est ton nom qu'on murmure sur les champs de bataille.",
  },
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
  // L'Éclipse (315 km) : les cinq de la Main de Dieu se succèdent. Entre l'Éclipse et « Le Comte » (350 km) il y a
  // environ 46 700 pas : les cinq duels en demandent 42 000, comme pour Zodd, il reste un peu de marge.
  {
    id: "void",
    bossName: "Void",
    title: "L'Éclipse : Void",
    checkpointId: "cp-008",
    phases: [{ id: "base", label: "Le Vide", hp: 6_000, image: VOID }],
    intro: "Le ciel s'est éteint. Void préside le rite, sans un geste. Chaque pas que tu fais entame son calme.",
    phaseChangeTexts: [],
    victoryTitle: "Void se détourne",
    victoryText:
      "Le Vide reste silencieux, puis son regard passe à un autre. Tu n'as pas gagné, tu as seulement tenu : dans cet enfer, c'est déjà beaucoup.",
  },
  {
    id: "ubik",
    bossName: "Ubik",
    title: "L'Éclipse : Ubik",
    checkpointId: "cp-008",
    afterEncounterId: "void",
    phases: [{ id: "base", label: "Le Rieur", hp: 7_000, image: UBIK }],
    intro: "Ubik rit doucement, comme devant un enfant qui s'obstine. Marche : chaque pas fait taire ce rire un peu plus.",
    phaseChangeTexts: [],
    victoryTitle: "Ubik cesse de rire",
    victoryText:
      "Le rire s'éteint d'un coup. Ubik te dévisage, vexé, puis s'efface. Le suivant approche déjà.",
  },
  {
    id: "conrad",
    bossName: "Conrad",
    title: "L'Éclipse : Conrad",
    checkpointId: "cp-008",
    afterEncounterId: "ubik",
    phases: [{ id: "base", label: "Le Colosse", hp: 8_000, image: CONRAD }],
    intro: "Conrad avance, lent et pesant, et chaque pas qu'il fait te coûte. Réponds-lui du tien, un après l'autre.",
    phaseChangeTexts: [],
    victoryTitle: "Conrad recule",
    victoryText:
      "La masse s'arrête, hésite, puis cède du terrain. Tu l'as usé à force de patience. Il en reste deux.",
  },
  {
    id: "slan",
    bossName: "Slan",
    title: "L'Éclipse : Slan",
    checkpointId: "cp-008",
    afterEncounterId: "conrad",
    phases: [{ id: "base", label: "La Tentatrice", hp: 9_000, image: SLAN }],
    intro: "Slan te regarde de haut, sûre d'elle. Ne baisse pas les yeux : continue d'avancer.",
    phaseChangeTexts: [],
    victoryTitle: "Slan perd son sourire",
    victoryText:
      "Pour la première fois, elle ne sourit plus. Tu n'as pas cédé, et elle le sait. Plus qu'un seul.",
  },
  {
    id: "femto",
    bossName: "Femto",
    title: "L'Éclipse : Femto",
    checkpointId: "cp-008",
    afterEncounterId: "slan",
    phases: [{ id: "base", label: "Le Faucon Déchu", hp: 12_000, image: FEMTO }],
    intro: "Femto est le dernier. Celui que tu suivais, celui que tu as aimé. Chaque pas est une réponse.",
    phaseChangeTexts: [],
    victoryTitle: "Tu as survécu à l'Éclipse",
    victoryText:
      "Le ciel se déchire. Tu n'as pas triomphé de la Main de Dieu : tu as survécu, et tu portes désormais la Marque. La route continue, et c'est ta force. Cours.",
  },
];
