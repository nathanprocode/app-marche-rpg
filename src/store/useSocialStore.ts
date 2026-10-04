import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { DEV_PREVIEW_UID, isDevPreview } from "../core/devPreview";
import {
  generateGroupCode,
  normalizeGroupCode,
  type BandMember,
} from "../features/social/band";
import { bandExists, createBand, leaveBand, publishMember, subscribeMembers } from "../features/social/service";

const storageKey = (uid: string) => `marche-du-faucon:band:${uid}`;

export type BandError = "invalid-code" | "unknown-band" | "network";

/** Ce qu'on publie de soi : fourni par l'appelant, pour que ce store ne dépende pas des autres. */
export type MyBandStatus = Omit<BandMember, "updatedAtISO">;

type SocialState = {
  /** Code nu de la bande (sans « FAUCON- »), ou null. */
  code: string | null;
  members: BandMember[];
  /** Vrai tant qu'on n'a pas reçu la première liste de membres. */
  isLoading: boolean;
  isBusy: boolean;
  error: BandError | null;
  start: (uid: string, me: () => MyBandStatus) => Promise<void>;
  stop: () => void;
  createBand: () => Promise<void>;
  joinBand: (input: string) => Promise<void>;
  leaveBand: () => Promise<void>;
  /** Publie ta position dans la bande (appelé à chaque sauvegarde cloud). Sans bande, ne fait rien. */
  publish: (status: MyBandStatus) => Promise<void>;
};

let currentUid: string | null = null;
let readMe: (() => MyBandStatus) | null = null;
let unsubscribe: (() => void) | null = null;

/** Amis fictifs du mode test web : ils avancent un peu à chaque ouverture. */
function devPreviewMembers(): BandMember[] {
  const now = new Date();
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
  return [
    { uid: "dev-casca", displayName: "Casca", lap: 1, totalDistanceKm: 142.3, streakDays: 12, updatedAtISO: ago(1) },
    { uid: "dev-judeau", displayName: "Judeau", lap: 1, totalDistanceKm: 61.8, streakDays: 3, updatedAtISO: ago(47) },
    { uid: "dev-pippin", displayName: "Pippin", lap: 1, totalDistanceKm: 12.4, streakDays: 0, updatedAtISO: ago(60 * 26) },
  ];
}

function watch(code: string, set: (partial: Partial<SocialState>) => void): void {
  unsubscribe?.();
  unsubscribe = null;
  if (isDevPreview) {
    set({ members: devPreviewMembers(), isLoading: false });
    return;
  }
  set({ isLoading: true });
  unsubscribe = subscribeMembers(
    code,
    (members) => set({ members, isLoading: false }),
    (error) => {
      console.log("[SocialStore] members unavailable", error);
      set({ isLoading: false, error: "network" });
    },
  );
}

function saveCode(uid: string, code: string | null): void {
  const task = code ? AsyncStorage.setItem(storageKey(uid), code) : AsyncStorage.removeItem(storageKey(uid));
  task.catch((error) => console.log("[SocialStore] unable to save band code", error));
}

export const useSocialStore = create<SocialState>((set, get) => ({
  code: null,
  members: [],
  isLoading: false,
  isBusy: false,
  error: null,

  start: async (uid, me) => {
    currentUid = uid;
    readMe = me;
    let code: string | null = null;
    try {
      code = normalizeGroupCode((await AsyncStorage.getItem(storageKey(uid))) ?? "");
    } catch (error) {
      console.log("[SocialStore] unable to read band code", error);
    }
    if (currentUid !== uid) return;
    if (isDevPreview && uid === DEV_PREVIEW_UID) code = code ?? "DEVTST";

    set({ code, members: [], error: null });
    if (code) watch(code, set);
  },

  stop: () => {
    unsubscribe?.();
    unsubscribe = null;
    currentUid = null;
    readMe = null;
    set({ code: null, members: [], isLoading: false, isBusy: false, error: null });
  },

  createBand: async () => {
    const uid = currentUid;
    if (!uid || !readMe || get().isBusy) return;
    set({ isBusy: true, error: null });
    try {
      let code = generateGroupCode();
      if (!isDevPreview) {
        for (let attempt = 0; attempt < 5 && !(await createBand(code, uid)); attempt += 1) code = generateGroupCode();
        await publishMember(code, { ...readMe(), updatedAtISO: new Date().toISOString() });
      }
      saveCode(uid, code);
      set({ code, isBusy: false });
      watch(code, set);
    } catch (error) {
      console.log("[SocialStore] create failed", error);
      set({ isBusy: false, error: "network" });
    }
  },

  joinBand: async (input) => {
    const uid = currentUid;
    if (!uid || !readMe || get().isBusy) return;
    const code = normalizeGroupCode(input);
    if (!code) {
      set({ error: "invalid-code" });
      return;
    }
    set({ isBusy: true, error: null });
    try {
      if (!isDevPreview) {
        if (!(await bandExists(code))) {
          set({ isBusy: false, error: "unknown-band" });
          return;
        }
        await publishMember(code, { ...readMe(), updatedAtISO: new Date().toISOString() });
      }
      saveCode(uid, code);
      set({ code, isBusy: false });
      watch(code, set);
    } catch (error) {
      console.log("[SocialStore] join failed", error);
      set({ isBusy: false, error: "network" });
    }
  },

  leaveBand: async () => {
    const { code } = get();
    const uid = currentUid;
    if (!code || !uid) return;
    set({ isBusy: true, error: null });
    try {
      if (!isDevPreview) await leaveBand(code, uid);
      unsubscribe?.();
      unsubscribe = null;
      saveCode(uid, null);
      set({ code: null, members: [], isBusy: false });
    } catch (error) {
      console.log("[SocialStore] leave failed", error);
      set({ isBusy: false, error: "network" });
    }
  },

  publish: async (status) => {
    const { code } = get();
    if (!code || isDevPreview) return;
    try {
      await publishMember(code, { ...status, updatedAtISO: new Date().toISOString() });
    } catch (error) {
      console.log("[SocialStore] publish failed", error);
    }
  },
}));
