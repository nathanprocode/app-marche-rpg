import { GAME_CONFIG } from "../../core/constants/game";
import type { BossEncounter, BossPhase } from "../../data/bosses";
import type { BerserkCheckpoint } from "../../data/map/berserk-checkpoints";

export type DuelState = "locked" | "active" | "won";

export type DuelStatus = {
  encounter: BossEncounter;
  state: DuelState;
  /** Pas faits depuis l'ouverture du duel. */
  damage: number;
  totalHp: number;
  /** Forme en cours (la dernière une fois le duel gagné). */
  phaseIndex: number;
  phase: BossPhase;
  phaseHp: number;
  phaseHpLeft: number;
};

/** Pas du tour où le checkpoint est atteint (même arrondi que partout ailleurs dans l'app). */
export function stepsAtKm(km: number): number {
  return Math.ceil((km * 1000) / GAME_CONFIG.metersPerStep);
}

function totalHpOf(encounter: BossEncounter): number {
  return encounter.phases.reduce((sum, phase) => sum + phase.hp, 0);
}

/**
 * Pas du tour où le duel s'ouvre : le checkpoint, ou la fin du duel précédent quand ils s'enchaînent.
 * `encounters` sert à retrouver le duel précédent.
 */
export function duelStartSteps(
  encounter: BossEncounter,
  encounters: BossEncounter[],
  checkpoints: BerserkCheckpoint[],
): number {
  if (encounter.afterEncounterId) {
    const previous = encounters.find((item) => item.id === encounter.afterEncounterId);
    if (!previous) throw new Error(`Duel inconnu : ${encounter.afterEncounterId}`);
    return duelStartSteps(previous, encounters, checkpoints) + totalHpOf(previous);
  }

  const checkpoint = checkpoints.find((item) => item.id === encounter.checkpointId);
  if (!checkpoint) throw new Error(`Checkpoint inconnu : ${encounter.checkpointId}`);
  return stepsAtKm(checkpoint.kmThreshold);
}

export function computeDuel(
  encounter: BossEncounter,
  lapSteps: number,
  checkpoints: BerserkCheckpoint[],
  encounters: BossEncounter[] = [encounter],
): DuelStatus {
  const totalHp = totalHpOf(encounter);
  const startSteps = duelStartSteps(encounter, encounters, checkpoints);
  const first = encounter.phases[0];

  if (lapSteps < startSteps) {
    return { encounter, state: "locked", damage: 0, totalHp, phaseIndex: 0, phase: first, phaseHp: first.hp, phaseHpLeft: first.hp };
  }

  const damage = lapSteps - startSteps;
  if (damage >= totalHp) {
    const lastIndex = encounter.phases.length - 1;
    const last = encounter.phases[lastIndex];
    return { encounter, state: "won", damage, totalHp, phaseIndex: lastIndex, phase: last, phaseHp: last.hp, phaseHpLeft: 0 };
  }

  let remaining = damage;
  for (let index = 0; index < encounter.phases.length; index += 1) {
    const phase = encounter.phases[index];
    if (remaining < phase.hp) {
      return { encounter, state: "active", damage, totalHp, phaseIndex: index, phase, phaseHp: phase.hp, phaseHpLeft: phase.hp - remaining };
    }
    remaining -= phase.hp;
  }
  // Inatteignable : damage < totalHp tombe forcément dans une forme.
  throw new Error("Duel incohérent");
}

export function computeDuels(encounters: BossEncounter[], lapSteps: number, checkpoints: BerserkCheckpoint[]): DuelStatus[] {
  return encounters.map((encounter) => computeDuel(encounter, lapSteps, checkpoints, encounters));
}

export type BossEvent =
  | { type: "phase"; encounterId: string; phaseIndex: number }
  | { type: "victory"; encounterId: string; lap: number };

/** Clé d'une victoire : un duel se rejoue à chaque tour de Traque. */
export function victoryKey(lap: number, encounterId: string): string {
  return `${lap}/${encounterId}`;
}

/** Identifiants des duels gagnés au moins une fois, tous tours confondus. */
export function victoriousEncounterIds(victories: Record<string, string>): string[] {
  return Array.from(new Set(Object.keys(victories).map((key) => key.split("/")[1])));
}

/**
 * Ce qui s'est passé entre deux états du même tour : changement de forme, victoire.
 * Un saut de plusieurs formes d'un coup ne donne que la victoire ou la dernière forme.
 */
export function diffDuels(previous: DuelStatus[], next: DuelStatus[], lap: number): BossEvent[] {
  const events: BossEvent[] = [];
  next.forEach((status, index) => {
    const before = previous[index];
    if (!before || before.encounter.id !== status.encounter.id) return;

    if (status.state === "won" && before.state !== "won") {
      events.push({ type: "victory", encounterId: status.encounter.id, lap });
    } else if (status.state === "active" && before.state === "active" && status.phaseIndex > before.phaseIndex) {
      events.push({ type: "phase", encounterId: status.encounter.id, phaseIndex: status.phaseIndex });
    }
  });
  return events;
}
