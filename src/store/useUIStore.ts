import { create } from "zustand";

type TabKey = "home" | "map" | "quests" | "profile";

type UIState = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
