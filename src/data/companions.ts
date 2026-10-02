import type { ImageSourcePropType } from "react-native";

export type CompanionTravel = {
  fromCheckpointId: string;
  /** Il quitte Guts en atteignant ce checkpoint ; sans valeur, il reste jusqu'au bout de la Traque. */
  untilCheckpointId?: string;
};

export type Companion = {
  id: string;
  name: string;
  title: string;
  description: string;
  /** Sprite en pixel art, fond transparent, 192 px de haut. */
  image: ImageSourcePropType;
  /** Checkpoint où on le rencontre : il entre alors dans la collection. */
  metAtCheckpointId: string;
  /** Tronçons de la Traque où il marche aux côtés de Guts sur la carte. */
  travels: CompanionTravel[];
};

/** Les compagnons, dans l'ordre de rencontre (c'est aussi leur ordre autour de Guts sur la carte). */
export const COMPANIONS: Companion[] = [
  {
    id: "casca",
    name: "Casca",
    title: "Commandante de l'Avant-Garde",
    description:
      "Guerrière redoutable et meneuse née, Casca est le cœur battant de la Troupe. Elle tient la cadence des longues expéditions et ne laisse jamais personne derrière. Avec son regard posé sur tes pas, tu n'as plus aucune excuse pour rester immobile.",
    image: require("../../assets/companions/casca.png"),
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }, { fromCheckpointId: "cp-011" }],
  },
  {
    id: "griffith",
    name: "Griffith",
    title: "Le Rêveur Inaccessible",
    description:
      "Charismatique et mû par une ambition dévorante, Griffith ne marche pas : il trace la route vers son propre royaume. Son regard reste fixé sur l'horizon. L'avoir à tes côtés te rappelle pourquoi tu as commencé cette Traque : seul le sommet compte.",
    image: require("../../assets/companions/griffith.png"),
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }],
  },
  {
    id: "skullknight",
    name: "Le Chevalier Squelette",
    title: "L'Ombre Millénaire",
    description:
      "Cavalier énigmatique errant dans les interstices du monde, il apparaît là où le destin vacille. Il ne connaît ni la fatigue ni l'hésitation. Sa présence est le présage des grandes épreuves : avec lui pour t'observer, il n'est plus question d'abandonner.",
    image: require("../../assets/companions/skullknight.png"),
    metAtCheckpointId: "cp-008",
    travels: [{ fromCheckpointId: "cp-008", untilCheckpointId: "cp-008-5" }],
  },
  {
    id: "isidro",
    name: "Isidro",
    title: "L'Étincelle Rebelle",
    description:
      "Infatigable, bruyant et toujours prêt à foncer tête baissée, Isidro court souvent plus vite qu'il ne devrait, poussé par son rêve de devenir le plus grand des guerriers. Quand ton énergie baisse, il est là pour te provoquer et te faire presser le pas.",
    image: require("../../assets/companions/isidro.png"),
    metAtCheckpointId: "cp-009",
    travels: [{ fromCheckpointId: "cp-009" }],
  },
  {
    id: "farnese",
    name: "Farnèse",
    title: "L'Étudiante Déterminée",
    description:
      "Ancienne fanatique terrifiée par le monde, Farnèse a choisi de descendre de son piédestal pour affronter la réalité. Elle incarne la résilience : peu importe d'où tu pars, l'important est de faire le premier pas, puis le suivant.",
    image: require("../../assets/companions/farnese.png"),
    metAtCheckpointId: "cp-011",
    travels: [{ fromCheckpointId: "cp-011" }],
  },
  {
    id: "serpico",
    name: "Serpico",
    title: "Le Gardien du Vent",
    description:
      "Agile, silencieux et toujours en alerte, Serpico danse au milieu de la tempête. Il t'apprend à trouver ta propre cadence, celle qui te permet d'avancer longtemps sans t'épuiser, et à glisser sur les obstacles du quotidien.",
    image: require("../../assets/companions/serpico.png"),
    metAtCheckpointId: "cp-011",
    travels: [{ fromCheckpointId: "cp-011" }],
  },
  {
    id: "schierke",
    name: "Schierke",
    title: "La Guide Spirituelle",
    description:
      "Jeune prodige de la magie, Schierke voit les flux d'énergie que les autres ignorent. Elle t'accompagne dans les moments de doute, quand le chemin semble trop long. Avec elle, l'effort devient méditation : l'esprit clair, le souffle régulier, le pas sûr.",
    image: require("../../assets/companions/schierke.png"),
    metAtCheckpointId: "cp-012",
    travels: [{ fromCheckpointId: "cp-012" }],
  },
];
