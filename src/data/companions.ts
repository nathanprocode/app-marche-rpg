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
  /**
   * Sprite en pixel art, fond transparent, 192 px de haut (assets/companions/<id>.png).
   * Sans sprite, la fiche montre une silhouette et le compagnon n'apparaît pas sur la carte.
   */
  image?: ImageSourcePropType;
  /** Checkpoint où on le rencontre : il entre alors dans la collection. */
  metAtCheckpointId: string;
  /** Tronçons de la Traque où il marche aux côtés de Guts sur la carte. */
  travels: CompanionTravel[];
};

/** Les compagnons, dans l'ordre de rencontre (c'est aussi leur ordre autour de Guts sur la carte). */
export const COMPANIONS: Companion[] = [
  {
    id: "gambino",
    name: "Gambino",
    title: "Le Maître Cruel",
    description:
      "Mercenaire borgne et sans pitié, Gambino a élevé Guts à coups de bâton dans la boue des champs de bataille. Il t'apprend la leçon la plus dure : personne ne viendra marcher à ta place. Chaque pas que tu fais, tu le fais pour toi.",
    // Sprite à fournir : assets/companions/gambino.png, puis image: require("../../assets/companions/gambino.png").
    metAtCheckpointId: "cp-002",
    travels: [{ fromCheckpointId: "cp-002", untilCheckpointId: "cp-003" }],
  },
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
    id: "judeau",
    name: "Judeau",
    title: "Le Lanceur de Couteaux",
    description:
      "Sourire en coin et regard qui ne rate rien, Judeau est le plus fin tireur de la Troupe du Faucon. Il prend la vie avec légèreté, même au pire moment. Quand la route te semble lourde, il te rappelle qu'on avance mieux le cœur léger.",
    // Sprite à fournir : assets/companions/judeau.png, puis image: require("../../assets/companions/judeau.png").
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }, { fromCheckpointId: "cp-007", untilCheckpointId: "cp-008" }],
  },
  {
    id: "pippin",
    name: "Pippin",
    title: "Le Colosse au Grand Cœur",
    description:
      "Taciturne, immense et d'une douceur inattendue, Pippin porte sans broncher ce que les autres ne peuvent pas soulever. Il ne parle pas beaucoup, mais il est toujours là, au même pas que toi, jusqu'à ce que tu arrives au bout de la journée.",
    // Sprite à fournir : assets/companions/pippin.png, puis image: require("../../assets/companions/pippin.png").
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }, { fromCheckpointId: "cp-007", untilCheckpointId: "cp-008" }],
  },
  {
    id: "corkus",
    name: "Corkus",
    title: "Le Fanfaron",
    description:
      "Vantard, jaloux et prompt à s'emporter, Corkus ne supporte pas de se laisser distancer. Cette fierté mal placée est aussi ce qui le fait avancer : à côté de lui, tu as toujours une bonne raison de ne pas te laisser dépasser.",
    // Sprite à fournir : assets/companions/corkus.png, puis image: require("../../assets/companions/corkus.png").
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }, { fromCheckpointId: "cp-007", untilCheckpointId: "cp-008" }],
  },
  {
    id: "rickert",
    name: "Rickert",
    title: "Le Cadet de la Troupe",
    description:
      "Le plus jeune des Faucons, Rickert compense sa force modeste par son esprit : il sait réparer les armes et prévoir les imprévus. Il te rappelle qu'on va plus loin avec un bon équipement, de bonnes chaussures et un peu d'organisation.",
    // Sprite à fournir : assets/companions/rickert.png, puis image: require("../../assets/companions/rickert.png").
    metAtCheckpointId: "cp-004",
    travels: [{ fromCheckpointId: "cp-004", untilCheckpointId: "cp-006" }, { fromCheckpointId: "cp-007", untilCheckpointId: "cp-008" }, { fromCheckpointId: "cp-009", untilCheckpointId: "cp-010" }],
  },
  {
    id: "zodd",
    name: "Zodd",
    title: "Le Fauve Immortel",
    description:
      "Géant à la cape déchirée, Zodd ne marche pas à tes côtés : il rôde au bord de ta route, attiré par ceux qui refusent de plier. Pour lui, chaque kilomètre est un duel. Sentir son ombre derrière toi suffit à garder le rythme.",
    image: require("../../assets/companions/zodd.png"),
    metAtCheckpointId: "cp-004-5",
    travels: [{ fromCheckpointId: "cp-004-5", untilCheckpointId: "cp-005" }, { fromCheckpointId: "cp-011-5", untilCheckpointId: "cp-012" }],
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
    id: "godo",
    name: "Godo",
    title: "Le Forgeron de la Vallée",
    description:
      "Vieil artisan bourru à la barbe blanche, Godo a forgé l'épée qui demande une force démesurée. Il ne quitte jamais son atelier, mais sa leçon voyage avec toi : les grandes choses se construisent coup après coup, pas après pas.",
    // Sprite à fournir : assets/companions/godo.png, puis image: require("../../assets/companions/godo.png").
    metAtCheckpointId: "cp-009",
    travels: [],
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
    id: "flora",
    name: "Flora",
    title: "La Vieille Sorcière",
    description:
      "Doyenne des sorcières et maîtresse de Schierke, Flora veille sur sa demeure comme sur un refuge. Elle sait que les corps comme les esprits se réparent avec le temps : elle te rappelle de t'arrêter respirer, puis de reprendre la route.",
    // Sprite à fournir : assets/companions/flora.png, puis image: require("../../assets/companions/flora.png").
    metAtCheckpointId: "cp-012",
    travels: [],
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
