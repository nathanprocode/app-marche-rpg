import { create } from "zustand";

type AuthState = {
  isAuthenticated: boolean;
  userName: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: null,
  loginWithGoogle: async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    set({ isAuthenticated: true, userName: "Épéiste Noir" });
  },
  logout: () => set({ isAuthenticated: false, userName: null }),
}));
