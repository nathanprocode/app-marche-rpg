import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEV_PREVIEW_UID } from "../../core/devPreview";
import { firestoreDb } from "../../core/firebase";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { buildProgressFromSteps } from "../progression/engine";
import type { PlayerProgress } from "../progression/types";

/** Records, succès et tour de Traque : copiés dans Firestore à côté de la progression. */
export type CloudExtras = {
  bestStreak: number;
  bestDaySteps: number;
  achievements: Record<string, string>;
  bossVictories: Record<string, string>;
};

export type UserCloudDoc = {
  uid: string;
  displayName: string;
  progression: PlayerProgress;
  unlockedCheckpoints: string[];
  brandIntensity: number;
  updatedAtISO: string;
  extras?: Partial<CloudExtras>;
};

function resolveUnlockedCheckpoints(totalDistanceKm: number, savedIds: string[] = []): string[] {
  const reachedIds = BERSERK_CHECKPOINTS.filter(
    (checkpoint) => checkpoint.kmThreshold <= totalDistanceKm + 0.0001,
  ).map((checkpoint) => checkpoint.id);

  return Array.from(new Set([...savedIds, ...reachedIds]));
}

export function buildDefaultUserCloudDoc(uid: string, displayName: string): UserCloudDoc {
  const progression: PlayerProgress = buildProgressFromSteps(0, 0, new Date(0).toISOString());

  return {
    uid,
    displayName,
    progression,
    unlockedCheckpoints: resolveUnlockedCheckpoints(progression.totalDistanceKm),
    brandIntensity: 0.1,
    updatedAtISO: new Date().toISOString(),
  };
}

/** Données fictives du mode test : aucun appel réseau. */
function buildDevPreviewDoc(displayName: string): UserCloudDoc {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const progression = buildProgressFromSteps(90822, 3, yesterday);
  return {
    uid: DEV_PREVIEW_UID,
    displayName,
    progression,
    unlockedCheckpoints: resolveUnlockedCheckpoints(progression.totalDistanceKm),
    brandIntensity: 0.4,
    updatedAtISO: new Date().toISOString(),
  };
}

export async function ensureUserDocAndLoad(uid: string, displayName: string): Promise<UserCloudDoc> {
  if (uid === DEV_PREVIEW_UID) return buildDevPreviewDoc(displayName);

  const ref = doc(firestoreDb, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const fallbackDoc = buildDefaultUserCloudDoc(uid, displayName);
    const cloudDoc = snap.data() as Partial<UserCloudDoc>;
    const progression = cloudDoc.progression ?? fallbackDoc.progression;
    const unlockedCheckpoints = resolveUnlockedCheckpoints(progression.totalDistanceKm, cloudDoc.unlockedCheckpoints);

    return {
      ...fallbackDoc,
      ...cloudDoc,
      progression,
      unlockedCheckpoints,
    };
  }

  const initialDoc = buildDefaultUserCloudDoc(uid, displayName);
  await setDoc(ref, initialDoc);
  return initialDoc;
}

export async function saveProgressionToCloud(
  uid: string,
  progression: PlayerProgress,
  brandIntensity: number,
  unlockedCheckpoints: string[] = [],
  extras?: CloudExtras,
) {
  if (uid === DEV_PREVIEW_UID) return;

  const ref = doc(firestoreDb, "users", uid);
  await setDoc(
    ref,
    {
      progression,
      unlockedCheckpoints: resolveUnlockedCheckpoints(progression.totalDistanceKm, unlockedCheckpoints),
      brandIntensity,
      ...(extras ? { extras } : {}),
      updatedAtISO: new Date().toISOString(),
    },
    { merge: true },
  );
}
