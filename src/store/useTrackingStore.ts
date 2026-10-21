import { Linking } from "react-native";
import { create } from "zustand";
import { isDevPreview } from "../core/devPreview";
import { trackingStatusFromQuery, type TrackingStatus } from "../features/pedometer/trackingStatus";

type TrackingState = {
  status: TrackingStatus;
  setStatus: (status: TrackingStatus) => void;
  /** Incrémenté pour relancer le comptage (bouton « Réessayer », retour des réglages du téléphone). */
  attempt: number;
  retry: () => void;
  /** Le joueur est parti dans les réglages du téléphone par notre bouton. */
  awaitingSettings: boolean;
  openSettings: () => void;
  /**
   * Au retour au premier plan : relance seulement au retour des réglages ouverts par l'appli. Relancer à chaque retour
   * redemanderait l'autorisation en boucle (la fermeture de la fenêtre d'autorisation est elle-même un retour).
   */
  retryAfterSettings: () => void;
};

// Mode test web : l'adresse peut imposer un état pour voir le message (voir trackingStatusFromQuery).
const devPreviewStatus = isDevPreview && typeof window !== "undefined" ? trackingStatusFromQuery(window.location.search) : null;

export const useTrackingStore = create<TrackingState>((set, get) => ({
  status: devPreviewStatus ?? { kind: "starting" },
  setStatus: (status) => {
    if (devPreviewStatus) return;
    set({ status });
  },
  attempt: 0,
  retry: () => set({ attempt: get().attempt + 1 }),
  awaitingSettings: false,
  openSettings: () => {
    set({ awaitingSettings: true });
    Linking.openSettings().catch((error) => {
      console.log("[Tracking] unable to open settings", error);
      set({ awaitingSettings: false });
    });
  },
  retryAfterSettings: () => {
    if (!get().awaitingSettings) return;
    set({ awaitingSettings: false });
    get().retry();
  },
}));
