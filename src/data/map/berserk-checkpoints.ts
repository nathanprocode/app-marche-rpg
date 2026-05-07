export type BerserkCheckpoint = {
  id: string;
  kmThreshold: number;
  arc: string;
  title: string;
  description: string;
  icon: string;
  x: number;
  y: number;
};

export const BERSERK_CHECKPOINTS: BerserkCheckpoint[] = [
  // --- ARC DE L'ÂGE D'OR ---
  { id: "cp-001", kmThreshold: 0, arc: "Âge d'Or", title: "L'Arbre des Pendus", description: "Ton périple commence dans la boue et le sang. Guts pousse son premier cri sous un arbre macabre. Marche pour survivre.", icon: "skull", x: 33, y: 48 },
  { id: "cp-002", kmThreshold: 18, arc: "Âge d'Or", title: "L'Ombre de Gambino", description: "Un entraînement impitoyable. Tu as appris à manier une épée bien trop lourde pour toi. Tes premiers kilomètres forgent ton endurance.", icon: "swords", x: 40, y: 50 },
  { id: "cp-003", kmThreshold: 52, arc: "Âge d'Or", title: "Le Briseur d'Ours", description: "Ton premier grand exploit en tant que mercenaire. Bazuso est tombé sous ta lame. Les rumeurs de ta force commencent à circuler.", icon: "shield", x: 45, y: 60 },
  { id: "cp-004", kmThreshold: 85, arc: "Âge d'Or", title: "La Rencontre avec le Faucon", description: "Une défaite écrasante face à Griffith. Ta liberté lui appartient désormais, mais une nouvelle famille s'offre à toi.", icon: "bird", x: 50, y: 60 },
  { id: "cp-004-5", kmThreshold: 115, arc: "Âge d'Or", title: "Nosferatu Zodd", description: "L'effroi absolu. Ta première confrontation avec un être qui dépasse l'entendement humain. La mort t'a frôlé.", icon: "bone", x: 65, y: 55 },
  { id: "cp-005", kmThreshold: 142, arc: "Âge d'Or", title: "La Chute de Doldrey", description: "Un triomphe éclatant ! La Troupe du Faucon entre dans la légende en prenant la forteresse imprenable.", icon: "castle", x: 34, y: 42 },
  { id: "cp-006", kmThreshold: 190, arc: "Âge d'Or", title: "Le Départ sous la Neige", description: "Le 2ème duel. D'un seul coup d'épée, tu brises l'emprise de Griffith pour trouver ta propre voie.", icon: "footprints", x: 49, y:50 },
  { id: "cp-007", kmThreshold: 250, arc: "Âge d'Or", title: "La Tour des Renaissances", description: "Le retour à Windham. Un sauvetage désespéré dans les geôles du roi pour retrouver un Griffith brisé.", icon: "key", x: 48, y: 41 },
  { id: "cp-008", kmThreshold: 315, arc: "Âge d'Or", title: "L'Éclipse", description: "Le point de rupture. L'enfer s'ouvre, le sacrifice est consommé. Tu portes désormais la Marque du Sacrifice. Cours.", icon: "moon-star", x: 70, y: 42 },
  { id: "cp-008-5", kmThreshold: 350, arc: "Guerrier Noir", title: "Le Comte", description: "Les premières années de traque. Le Guerrier Noir commence son massacre des Apôtres en semant la terreur.", icon: "ghost", x: 57, y: 35 },
  { id: "cp-009", kmThreshold: 384, arc: "Guerrier Noir", title: "La Forge de Godo", description: "Un bref refuge. Tu brandis enfin la Dragon Slayer. Ta vengeance prend la forme d'un bloc de fer.", icon: "hammer", x: 55, y: 30 },
  { id: "cp-010", kmThreshold: 460, arc: "Châtiments", title: "La Vallée des Brumes", description: "Une traque sanglante contre Rosine et ses elfes de cauchemar. Ta volonté est poussée à sa limite absolue.", icon: "cloud", x: 60, y: 50 },
  { id: "cp-011", kmThreshold: 545, arc: "Châtiments", title: "La Tour d'Albion", description: "Le fanatisme du père Mozgus et l'horreur des ombres. Tu as tout sacrifié pour protéger Casca de la folie des hommes.", icon: "flame", x: 61, y: 36 },
  { id: "cp-011-5", kmThreshold: 590, arc: "Faucon Millénaire", title: "La Colline aux Épées", description: "Un cimetière de lames sous la neige. Les retrouvailles glaciales avec Griffith réincarné et l'immortel Zodd.", icon: "cross", x: 55, y: 32 },
  { id: "cp-012", kmThreshold: 638, arc: "Faucon Millénaire", title: "La Demeure de Flora", description: "Un feu destructeur. Tu revêts l'Armure du Berserker pour repousser Grunbeld. Ta propre rage menace de te consumer.", icon: "leaf", x: 25, y: 70 },
  { id: "cp-013", kmThreshold: 770, arc: "Faucon Millénaire", title: "Le Port de Vritannis", description: "Au milieu de l'invasion Kushan, tu trouves enfin l'Hippocampe. L'heure est venue de quitter le continent.", icon: "anchor", x: 41, y: 79 },
  { id: "cp-014", kmThreshold: 890, arc: "Fantasia", title: "L'Antre du Dieu des Mers", description: "Une épreuve titanesque dans les abysses. Le son des battements de ton propre cœur te maintient en vie face au dieu tentaculaire.", icon: "waves", x: 8, y: 55 },
  { id: "cp-015", kmThreshold: 1000, arc: "Fantasia", title: "Elfhelm, l'Île de Skellig", description: "L'utopie lointaine. Tu as parcouru un millier de kilomètres. L'esprit de Casca peut enfin être soigné. Tu as mérité ce repos.", icon: "sparkles", x: 6, y: 42 },
];
