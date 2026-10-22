import { create } from "zustand";

type TabKey = "home" | "map" | "quests" | "profile";

type UIState = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  /** L'écran « Point franchi » est ouvert : la fin de Traque attend qu'il soit fermé. */
  isCheckpointModalOpen: boolean;
  setCheckpointModalOpen: (open: boolean) => void;
  /** L'introduction rouverte depuis Réglages (« Comment ça marche »). */
  isIntroReopened: boolean;
  setIntroReopened: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCheckpointModalOpen: false,
  setCheckpointModalOpen: (open) => set({ isCheckpointModalOpen: open }),
  isIntroReopened: false,
  setIntroReopened: (open) => set({ isIntroReopened: open }),
}));
