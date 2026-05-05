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
  { id: "cp-001", kmThreshold: 0, arc: "Âge d'Or", title: "L'Arbre des Pendus", description: "Là où tout commence, sous un arbre macabre.", icon: "skull", x: 8, y: 82 },
  { id: "cp-002", kmThreshold: 18, arc: "Âge d'Or", title: "Le Campement de Gambino", description: "L'entraînement impitoyable de l'enfance.", icon: "swords", x: 14, y: 76 },
  { id: "cp-003", kmThreshold: 52, arc: "Âge d'Or", title: "Bazuso le Tueur de Trente", description: "Le premier grand exploit de Guts en tant que mercenaire.", icon: "shield", x: 22, y: 71 },
  { id: "cp-004", kmThreshold: 85, arc: "Âge d'Or", title: "Le Duel contre Griffith", description: "Une défaite qui change tout.", icon: "bird", x: 30, y: 66 },
  { id: "cp-005", kmThreshold: 142, arc: "Âge d'Or", title: "La Forteresse de Doldrey", description: "La Troupe du Faucon entre dans la légende.", icon: "castle", x: 39, y: 58 },
  { id: "cp-006", kmThreshold: 230, arc: "Âge d'Or", title: "Le Départ de Windham", description: "Guts part pour trouver sa propre voie.", icon: "footprints", x: 48, y: 52 },
  { id: "cp-007", kmThreshold: 315, arc: "Âge d'Or", title: "Le Lac de l'Éclipse", description: "L'enfer sur Terre, le sacrifice commence.", icon: "moon-star", x: 58, y: 46 },
  { id: "cp-008", kmThreshold: 384, arc: "Guerrier Noir", title: "La Forge de Godo", description: "La Dragon Slayer et la traque.", icon: "hammer", x: 64, y: 41 },
  { id: "cp-009", kmThreshold: 460, arc: "Enfants Perdus", title: "La Vallée des Brumes", description: "Rosine et la noirceur croissante.", icon: "cloud", x: 70, y: 36 },
  { id: "cp-010", kmThreshold: 545, arc: "Châtiments", title: "La Tour des Châtiments", description: "Le retour de Casca, l'horreur renaît.", icon: "flame", x: 76, y: 32 },
  { id: "cp-011", kmThreshold: 638, arc: "Faucon Millénaire", title: "La Demeure de Flora", description: "L'Armure du Berserker, cadeau empoisonné.", icon: "leaf", x: 82, y: 27 },
  { id: "cp-012", kmThreshold: 770, arc: "Faucon Millénaire", title: "Le Port de Vritannis", description: "Le départ vers l'inconnu.", icon: "anchor", x: 87, y: 22 },
  { id: "cp-013", kmThreshold: 890, arc: "Fantasia", title: "L'Antre du Dieu des Mers", description: "Une épreuve titanesque en pleine mer.", icon: "waves", x: 92, y: 16 },
  { id: "cp-014", kmThreshold: 1000, arc: "Fantasia", title: "Elfhelm, l'Île des Elfes", description: "La destination finale.", icon: "sparkles", x: 96, y: 10 },
];
