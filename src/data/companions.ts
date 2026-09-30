export type Companion = {
  id: string;
  name: string;
  title: string;
  description: string;
  unlockCheckpointId: string | null;
  unlockLabel: string;
  image: number;
};

export const COMPANIONS: Companion[] = [
  {
    id: "guts",
    name: "Guts",
    title: "Le Survivant \u00c9corch\u00e9",
    description:
      "Porteur de la Marque du Sacrifice, Guts avance co\u00fbte que co\u00fbte. La fatigue, la douleur et les obstacles ne sont que des d\u00e9tails sur sa route infinie. Avec lui, chaque kilom\u00e8tre parcouru est une bataille gagn\u00e9e contre le destin. Son \u00e9p\u00e9e est bien trop lourde pour un homme normal, tout comme la volont\u00e9 qu'il exige de toi pour continuer d'avancer. C'est le compagnon des jours difficiles, quand chaque pas est un effort.",
    unlockCheckpointId: null,
    unlockLabel: "Disponible des le depart",
    image: require("../../assets/map/guts-marker.png"),
  },
  {
    id: "casca",
    name: "Casca",
    title: "Commandante de l'Avant-Garde",
    description:
      "Guerri\u00e8re redoutable et leader n\u00e9e, Casca est le c\u0153ur battant de la Troupe. Elle sait maintenir la cadence lors des longues exp\u00e9ditions et ne laisse jamais personne derri\u00e8re. Sa pr\u00e9sence \u00e0 tes c\u00f4t\u00e9s impose une discipline de fer : avec son regard pos\u00e9 sur tes statistiques, tu n'as aucune excuse pour rester s\u00e9dentaire. Elle est l'alli\u00e9e parfaite pour maintenir ta r\u00e9gularit\u00e9 quotidienne.",
    unlockCheckpointId: "cp-004",
    unlockLabel: "Debloquee a La Rencontre avec le Faucon",
    image: require("../../assets/images/companion_casca.png"),
  },
  {
    id: "griffith",
    name: "Griffith",
    title: "Le R\u00eaveur Inaccessible",
    description:
      "Charismatique et m\u00fb par une ambition d\u00e9vorante, Griffith ne marche pas simplement, il trace la route vers son propre royaume. Son regard est toujours fix\u00e9 sur l'horizon et l'objectif final. L'avoir dans ton groupe te rappelle pourquoi tu as commenc\u00e9 cette longue traque : peu importe la distance qui te s\u00e9pare de ton but, seul le sommet compte. Un compagnon pour garder la motivation intacte sur le long terme.",
    unlockCheckpointId: "cp-004",
    unlockLabel: "Debloque a La Rencontre avec le Faucon",
    image: require("../../assets/images/companion_griffith.png"),
  },
  {
    id: "skullknight",
    name: "Skull Knight",
    title: "L'Ombre Millenaire",
    description:
      "Cavalier enigmatique errant dans les interstices du monde, le Skull Knight apparait la ou le destin vacille. Il ne connait ni la fatigue, ni l'hesitation, ni la fin du chemin. Sa presence a tes cotes est l'ultime presage de grands accomplissements. Avec lui pour t'observer, il n'est plus question d'abandonner : tu t'elances pour briser tes propres limites. C'est le compagnon des defis extremes, des records personnels et des marches qui semblent impossibles.",
    unlockCheckpointId: "cp-008",
    unlockLabel: "Debloque a L'Eclipse",
    image: require("../../assets/images/companion_skullknight.png"),
  },
  {
    id: "isidro",
    name: "Isidro",
    title: "L'Etincelle Rebelle",
    description:
      "Infatigable, bruyant et toujours pret a foncer tete baissee, Isidro est la fougue de l'avant-garde. Il court souvent plus vite qu'il ne devrait, pousse par son reve de devenir le guerrier ultime. Sa presence apporte un veritable coup de fouet a ta routine. Quand ton energie baisse, il est la pour te provoquer et t'encourager a accelerer le pas. Le compagnon parfait pour transformer une balade monotone en une marche dynamique et explosive.",
    unlockCheckpointId: "cp-009",
    unlockLabel: "Debloque a La Forge de Godo",
    image: require("../../assets/images/companion_isidro.png"),
  },
  {
    id: "farnese",
    name: "Farnese",
    title: "L'Etudiante Determinee",
    description:
      "Ancienne fanatique terrifiee par le monde exterieur, Farnese a choisi de descendre de son piedestal pour affronter la realite et reapprendre a vivre. Elle incarne la resilience et l'evolution personnelle. L'avoir dans ton groupe te rappelle que peu importe ton niveau de depart ou tes anciennes habitudes, l'important est de faire le premier pas. Elle te pousse a sortir de ta zone de confort et a transformer tes faiblesses en volonte, kilometre apres kilometre.",
    unlockCheckpointId: "cp-011",
    unlockLabel: "Debloquee a La Tour d'Albion",
    image: require("../../assets/images/companion_farnese.png"),
  },
  {
    id: "serpico",
    name: "Serpico",
    title: "Le Gardien du Vent",
    description:
      "Agile, silencieux et toujours en alerte, Serpico est un maitre de l'esquive qui danse au milieu de la tempete. Il incarne la legerete et la fluidite du mouvement. L'avoir a tes cotes t'aidera a trouver ta propre cadence, celle qui te permet d'avancer longtemps sans t'epuiser. Il est l'allie ideal pour t'apprendre a gerer ton energie, a glisser sur les obstacles du quotidien avec souplesse et a garder un rythme de marche parfait.",
    unlockCheckpointId: "cp-011",
    unlockLabel: "Debloque a La Tour d'Albion",
    image: require("../../assets/images/companion_serpico.png"),
  },
  {
    id: "schierke",
    name: "Schierke",
    title: "La Guide Spirituelle",
    description:
      "Jeune prodige de la magie, Schierke voit les flux d'energie que les autres ignorent. Elle t'accompagne dans les moments de doute, lorsque le chemin semble trop long ou l'objectif trop brumeux. Avec elle, l'effort physique devient une veritable meditation. Elle t'aide a garder ton esprit clair, ta respiration fluide et tes pas reguliers, apaisant la brulure de tes muscles pour te permettre d'atteindre un etat de grace sur les longues distances.",
    unlockCheckpointId: "cp-012",
    unlockLabel: "Debloquee a La Demeure de Flora",
    image: require("../../assets/images/companion_schierke.png"),
  },
];
