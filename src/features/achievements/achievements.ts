/** Ce que les succès regardent : tout se déduit de la progression, rien d'autre n'est à suivre. */
export type AchievementStats = {
  /** Distance depuis le premier jour, tours de Traque compris. */
  lifetimeKm: number;
  bestStreak: number;
  bestDaySteps: number;
  checkpointsUnlocked: number;
  checkpointsTotal: number;
  companionsMet: number;
  companionsTotal: number;
  lapsCompleted: number;
  /** Identifiants des duels de boss gagnés au moins une fois (tous tours confondus). */
  bossesDefeated: string[];
};

export type AchievementCategory = "distance" | "streak" | "day" | "collection" | "lap" | "boss";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  /** Nom d'icône Ionicons. */
  icon: string;
  /** Valeur actuelle sur cible : alimente la barre des succès verrouillés. */
  progress: (stats: AchievementStats) => { value: number; target: number };
};

/** Les cinq duels de l'Éclipse, dans l'ordre. */
const ECLIPSE_DUELS = ["void", "ubik", "conrad", "slan", "femto"];

function threshold(
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  icon: string,
  target: number,
  pick: (stats: AchievementStats) => number,
): Achievement {
  return { id, title, description, category, icon, progress: (stats) => ({ value: pick(stats), target }) };
}

const km = (stats: AchievementStats) => stats.lifetimeKm;
const streak = (stats: AchievementStats) => stats.bestStreak;
const day = (stats: AchievementStats) => stats.bestDaySteps;

export const ACHIEVEMENTS: Achievement[] = [
  threshold("km-10", "Premier sang", "Parcourir 10 km.", "distance", "footsteps", 10, km),
  threshold("km-50", "Mercenaire", "Parcourir 50 km.", "distance", "walk", 50, km),
  threshold("km-100", "Briseur de routes", "Parcourir 100 km.", "distance", "trail-sign", 100, km),
  threshold("km-250", "Traqueur infatigable", "Parcourir 250 km.", "distance", "compass", 250, km),
  threshold("km-500", "Guerrier Noir", "Parcourir 500 km.", "distance", "skull", 500, km),
  threshold("km-1000", "Un millier de kilomètres", "Parcourir 1 000 km.", "distance", "flag", 1000, km),
  threshold("km-2500", "Au-delà de Fantasia", "Parcourir 2 500 km.", "distance", "planet", 2500, km),

  threshold("streak-3", "Trois nuits sans sang", "Série de 3 jours.", "streak", "flame", 3, streak),
  threshold("streak-7", "Une semaine apaisée", "Série de 7 jours.", "streak", "flame", 7, streak),
  threshold("streak-14", "Volonté de fer", "Série de 14 jours.", "streak", "flame", 14, streak),
  threshold("streak-30", "Un mois contre le destin", "Série de 30 jours.", "streak", "bonfire", 30, streak),
  threshold("streak-60", "Marque domptée", "Série de 60 jours.", "streak", "bonfire", 60, streak),
  threshold("streak-100", "Inébranlable", "Série de 100 jours.", "streak", "bonfire", 100, streak),

  threshold("day-5000", "Journée de chasse", "5 000 pas en une journée.", "day", "speedometer", 5000, day),
  threshold("day-10000", "Dix mille pas", "10 000 pas en une journée.", "day", "speedometer", 10_000, day),
  threshold("day-20000", "Frénésie du Berserker", "20 000 pas en une journée.", "day", "speedometer", 20_000, day),

  {
    id: "companions-all",
    title: "La Troupe réunie",
    description: "Rencontrer tous les compagnons.",
    category: "collection",
    icon: "people",
    progress: (stats) => ({ value: stats.companionsMet, target: stats.companionsTotal }),
  },
  {
    id: "chronicles-all",
    title: "Chroniqueur",
    description: "Lire toutes les Chroniques.",
    category: "collection",
    icon: "book",
    progress: (stats) => ({ value: stats.checkpointsUnlocked, target: stats.checkpointsTotal }),
  },

  {
    id: "boss-bazuso",
    title: "Tueur du Tueur",
    description: "Gagner le duel contre Bazuso.",
    category: "boss",
    icon: "skull",
    progress: (stats) => ({ value: stats.bossesDefeated.includes("bazuso") ? 1 : 0, target: 1 }),
  },
  {
    id: "boss-zodd-1",
    title: "Tenir tête à Zodd",
    description: "Gagner le duel contre Zodd.",
    category: "boss",
    icon: "skull",
    progress: (stats) => ({ value: stats.bossesDefeated.includes("zodd-1") ? 1 : 0, target: 1 }),
  },
  {
    id: "boss-zodd-2",
    title: "Rival de Zodd",
    description: "Gagner la revanche contre Zodd.",
    category: "boss",
    icon: "skull",
    progress: (stats) => ({ value: stats.bossesDefeated.includes("zodd-2") ? 1 : 0, target: 1 }),
  },
  {
    id: "boss-femto",
    title: "Survivant de l'Éclipse",
    description: "Tenir tête aux cinq de la Main de Dieu, de Void à Femto.",
    category: "boss",
    icon: "moon",
    progress: (stats) => ({
      value: ECLIPSE_DUELS.filter((id) => stats.bossesDefeated.includes(id)).length,
      target: ECLIPSE_DUELS.length,
    }),
  },

  {
    id: "boss-mozgus",
    title: "Hérétique",
    description: "Gagner le duel contre Mozgus.",
    category: "boss",
    icon: "flame",
    progress: (stats) => ({ value: stats.bossesDefeated.includes("mozgus") ? 1 : 0, target: 1 }),
  },
  {
    id: "boss-grunbeld",
    title: "Tueur de Dragon",
    description: "Gagner le duel contre Grunbeld.",
    category: "boss",
    icon: "skull",
    progress: (stats) => ({ value: stats.bossesDefeated.includes("grunbeld") ? 1 : 0, target: 1 }),
  },

  threshold("lap-1", "La Traque achevée", "Terminer la Traque une fois.", "lap", "trophy", 1, (s) => s.lapsCompleted),
  threshold("lap-3", "Éternel Traqué", "Terminer la Traque trois fois.", "lap", "trophy", 3, (s) => s.lapsCompleted),
];

export function isAchievementEarned(achievement: Achievement, stats: AchievementStats): boolean {
  const { value, target } = achievement.progress(stats);
  return target > 0 && value >= target;
}

/** Identifiants des succès atteints par ces stats et pas encore débloqués. */
export function findNewAchievements(stats: AchievementStats, alreadyUnlocked: Record<string, string>): string[] {
  return ACHIEVEMENTS.filter(
    (achievement) => !alreadyUnlocked[achievement.id] && isAchievementEarned(achievement, stats),
  ).map((achievement) => achievement.id);
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
