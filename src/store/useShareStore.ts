import { create } from "zustand";
import type { ShareCardData } from "../features/share/shareCards";

type ShareState = {
  /** Carte en cours de partage : le ShareImageHost la dessine hors écran, la photographie puis la vide. */
  request: ShareCardData | null;
  requestShare: (card: ShareCardData) => void;
  clearShare: () => void;
};

export const useShareStore = create<ShareState>((set) => ({
  request: null,
  requestShare: (card) => set({ request: card }),
  clearShare: () => set({ request: null }),
}));
