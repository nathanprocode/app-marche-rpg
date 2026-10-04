import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { firestoreDb } from "../../core/firebase";
import { parseBandMember, type BandMember } from "./band";

/**
 * Firestore :
 * - groups/{code}                 : la bande (le code est le secret partagé entre amis)
 * - groups/{code}/members/{uid}   : ce que chaque membre partage (voir BandMember)
 * Les règles de sécurité sont dans firestore.rules.
 */

export class UnknownBandError extends Error {
  constructor() {
    super("unknown-band");
  }
}

export async function createBand(code: string, uid: string): Promise<boolean> {
  const ref = doc(firestoreDb, "groups", code);
  // Collision de code (très rare) : l'appelant en tire un autre.
  if ((await getDoc(ref)).exists()) return false;
  await setDoc(ref, { ownerId: uid, createdAtISO: new Date().toISOString() });
  return true;
}

export async function bandExists(code: string): Promise<boolean> {
  return (await getDoc(doc(firestoreDb, "groups", code))).exists();
}

/** Écrit (ou met à jour) ta ligne dans la bande. Sert à rejoindre et à publier ta position. */
export async function publishMember(code: string, member: BandMember): Promise<void> {
  const { uid, ...data } = member;
  await setDoc(doc(firestoreDb, "groups", code, "members", uid), { uid, ...data });
}

export async function leaveBand(code: string, uid: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, "groups", code, "members", uid));
}

/** Suit les membres en direct. Renvoie la fonction qui arrête le suivi. */
export function subscribeMembers(
  code: string,
  onMembers: (members: BandMember[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    collection(firestoreDb, "groups", code, "members"),
    (snapshot) => {
      const members = snapshot.docs
        .map((entry) => parseBandMember(entry.id, entry.data()))
        .filter((member): member is BandMember => member !== null);
      onMembers(members);
    },
    onError,
  );
}
