import { create } from "zustand";
import { DEV_PREVIEW_UID, isDevPreview } from "../core/devPreview";
import { subscribeFirebaseAuthState, signOutFirebase } from "../core/firebase";

type AuthState = {
  isAuthenticated: boolean;
  userName: string | null;
  userId: string | null;
  isAuthResolved: boolean;
  bindAuthListener: () => void;
  logout: () => Promise<void>;
};

let isBound = false;

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: null,
  userId: null,
  isAuthResolved: false,
  bindAuthListener: () => {
    if (isBound) return;
    isBound = true;

    if (isDevPreview) {
      set({ isAuthenticated: true, userName: "Testeur", userId: DEV_PREVIEW_UID, isAuthResolved: true });
      return;
    }

    subscribeFirebaseAuthState((user) => {
      if (user) {
        set({
          isAuthenticated: true,
          userName: user.displayName ?? "Traqué",
          userId: user.uid,
          isAuthResolved: true,
        });
      } else {
        set({ isAuthenticated: false, userName: null, userId: null, isAuthResolved: true });
      }
    });
  },
  logout: async () => {
    if (!isDevPreview) await signOutFirebase();
    set({ isAuthenticated: false, userName: null, userId: null, isAuthResolved: true });
  },
}));
