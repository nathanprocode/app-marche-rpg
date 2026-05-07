import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestoreDb } from "../../core/firebase";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import type { PlayerProgress } from "../progression/types";

export type UserCloudDoc = {
  uid: string;
  displayName: string;
  progression: PlayerProgress;
  unlockedCheckpoints: string[];
  brandIntensity: number;
  updatedAtISO: string;
};

function resolveUnlockedCheckpoints(totalDistanceKm: number, savedIds: string[] = []): string[] {
  const reachedIds = BERSERK_CHECKPOINTS.filter(
    (checkpoint) => checkpoint.kmThreshold <= totalDistanceKm + 0.0001,
  ).map((checkpoint) => checkpoint.id);

  return Array.from(new Set([...savedIds, ...reachedIds]));
}

export function buildDefaultUserCloudDoc(uid: string, displayName: string): UserCloudDoc {
  const progression: PlayerProgress = {
    totalSteps: 0,
    totalDistanceKm: 0,
    progressPct: 0,
    currentStageId: "stage-001",
    currentStageProgressPct: 0,
    streakDays: 0,
    brandState: "idle",
    lastActiveDateISO: new Date(0).toISOString(),
  };

  return {
    uid,
    displayName,
    progression,
    unlockedCheckpoints: resolveUnlockedCheckpoints(progression.totalDistanceKm),
    brandIntensity: 0.1,
    updatedAtISO: new Date().toISOString(),
  };
}

export async function ensureUserDocAndLoad(uid: string, displayName: string): Promise<UserCloudDoc> {
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
) {
  const ref = doc(firestoreDb, "users", uid);
  await setDoc(
    ref,
    {
      progression,
      unlockedCheckpoints: resolveUnlockedCheckpoints(progression.totalDistanceKm, unlockedCheckpoints),
      brandIntensity,
      updatedAtISO: new Date().toISOString(),
    },
    { merge: true },
  );
}
