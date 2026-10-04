/** Logique pure de la Bande : code de groupe, classement, fraîcheur des données. Aucun accès réseau ici. */

/** Sans I, O, 0, 1 : le code se dicte et se recopie sans erreur. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
export const CODE_PREFIX = "FAUCON-";

/** Ce qu'un ami voit de toi : rien de plus que ces champs. */
export type BandMember = {
  uid: string;
  displayName: string;
  /** Tour de Traque en cours. */
  lap: number;
  /** Distance du tour (c'est elle qui place le Traqué sur la carte). */
  totalDistanceKm: number;
  streakDays: number;
  updatedAtISO: string;
};

export function generateGroupCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.min(CODE_ALPHABET.length - 1, Math.floor(random() * CODE_ALPHABET.length))];
  }
  return code;
}

/** Accepte « faucon-k7m2qx », « K7M2QX » ou avec des espaces ; renvoie le code nu en majuscules, ou null s'il est invalide. */
export function normalizeGroupCode(input: string): string | null {
  const bare = input
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^FAUCON-?/, "");
  const valid = bare.length === CODE_LENGTH && [...bare].every((char) => CODE_ALPHABET.includes(char));
  return valid ? bare : null;
}

export function formatGroupCode(code: string): string {
  return `${CODE_PREFIX}${code}`;
}

/** Relit un document de membre reçu du cloud (forme inconnue) ; null s'il est inutilisable. */
export function parseBandMember(uid: string, raw: unknown): BandMember | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const km = Number(data.totalDistanceKm);
  const name = typeof data.displayName === "string" ? data.displayName.trim() : "";
  if (!Number.isFinite(km) || km < 0 || !name) return null;

  const lap = Number(data.lap);
  const streak = Number(data.streakDays);
  return {
    uid,
    displayName: name.slice(0, 40),
    lap: Number.isFinite(lap) && lap >= 1 ? Math.floor(lap) : 1,
    totalDistanceKm: km,
    streakDays: Number.isFinite(streak) && streak >= 0 ? Math.floor(streak) : 0,
    updatedAtISO: typeof data.updatedAtISO === "string" ? data.updatedAtISO : new Date(0).toISOString(),
  };
}

/**
 * Classement : le tour le plus avancé d'abord, puis la distance du tour, puis le nom (ordre stable).
 * Ton propre état local remplace celui du cloud : il est toujours plus frais.
 */
export function rankMembers(members: BandMember[], me?: BandMember): BandMember[] {
  const merged = me ? [...members.filter((member) => member.uid !== me.uid), me] : [...members];
  return merged.sort(
    (a, b) =>
      b.lap - a.lap || b.totalDistanceKm - a.totalDistanceKm || a.displayName.localeCompare(b.displayName, "fr"),
  );
}

/** « à l'instant », « il y a 12 min », « il y a 3 h », « il y a 2 j ». */
export function freshnessLabel(updatedAtISO: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - new Date(updatedAtISO).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0 || minutes < 2) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
