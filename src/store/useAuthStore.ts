import { create } from "zustand";
import { subscribeFirebaseAuthState, signOutFirebase } from "../core/firebase";

type AuthState = {
  isAuthenticated: boolean;
  userName: string | null;
  isAuthResolved: boolean;
  bindAuthListener: () => void;
  applySignedInUser: (userName: string) => void;
  logout: () => Promise<void>;
};

let isBound = false;

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: null,
  isAuthResolved: false,
  bindAuthListener: () => {
    if (isBound) return;
    isBound = true;

    subscribeFirebaseAuthState((user) => {
      if (user) {
        set({ isAuthenticated: true, userName: user.displayName ?? "Traqué", isAuthResolved: true });
      } else {
        set({ isAuthenticated: false, userName: null, isAuthResolved: true });
      }
    });
  },
  applySignedInUser: (userName) => set({ isAuthenticated: true, userName, isAuthResolved: true }),
  logout: async () => {
    await signOutFirebase();
    set({ isAuthenticated: false, userName: null, isAuthResolved: true });
  },
}));
