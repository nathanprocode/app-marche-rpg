import { create } from "zustand";

type AuthState = {
  isAuthenticated: boolean;
  userName: string | null;
  setAuthenticatedUser: (userName: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: null,
  setAuthenticatedUser: (userName) => set({ isAuthenticated: true, userName }),
  logout: () => set({ isAuthenticated: false, userName: null }),
}));
