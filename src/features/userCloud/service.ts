import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestoreDb } from "../../core/firebase";
import type { PlayerProgress } from "../progression/types";

export type UserCloudDoc = {
  uid: string;
  displayName: string;
  progression: PlayerProgress;
  brandIntensity: number;
  updatedAtISO: string;
};

export function buildDefaultUserCloudDoc(uid: string, displayName: string): UserCloudDoc {
  return {
    uid,
    displayName,
    progression: {
      totalSteps: 0,
      totalDistanceKm: 0,
      progressPct: 0,
      currentStageId: "stage-001",
      currentStageProgressPct: 0,
      streakDays: 0,
      brandState: "idle",
      lastActiveDateISO: new Date(0).toISOString(),
    },
    brandIntensity: 0.1,
    updatedAtISO: new Date().toISOString(),
  };
}

export async function ensureUserDocAndLoad(uid: string, displayName: string): Promise<UserCloudDoc> {
  const ref = doc(firestoreDb, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserCloudDoc;
  }

  const initialDoc = buildDefaultUserCloudDoc(uid, displayName);
  await setDoc(ref, initialDoc);
  return initialDoc;
}

export async function saveProgressionToCloud(uid: string, progression: PlayerProgress, brandIntensity: number) {
  const ref = doc(firestoreDb, "users", uid);
  await setDoc(
    ref,
    {
      progression,
      brandIntensity,
      updatedAtISO: new Date().toISOString(),
    },
    { merge: true },
  );
}
