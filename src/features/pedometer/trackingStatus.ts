/**
 * État du comptage des pas, tel que le joueur doit le voir.
 *
 * - starting : démarrage en cours (ou navigateur, sans capteur) : rien à signaler.
 * - counting : les pas sont comptés.
 * - permissionDenied : autorisation « Activité physique » refusée ; `canAsk` dit si Android peut encore la redemander.
 * - sensorUnavailable : le téléphone n'a pas de compteur de pas.
 * - backgroundOff : suivi permanent demandé mais impossible (notifications refusées ou service bloqué) :
 *   les pas ne sont comptés que l'appli ouverte.
 * - error : le capteur n'a pas répondu.
 */
export type TrackingStatus =
  | { kind: "starting" }
  | { kind: "counting" }
  | { kind: "permissionDenied"; canAsk: boolean }
  | { kind: "sensorUnavailable" }
  | { kind: "backgroundOff" }
  | { kind: "error" };

export type TrackingAction = "retry" | "openSettings";

export type TrackingNotice = {
  title: string;
  detail: string;
  /** Ce que le bouton fait ; null quand le joueur ne peut rien y changer. */
  action: TrackingAction | null;
  actionLabel: string | null;
  /** true : plus aucun pas n'est compté (alerte) ; false : comptage réduit (avertissement). */
  blocking: boolean;
};

/** Le message à afficher sur l'accueil, ou null quand tout va bien. */
export function describeTrackingStatus(status: TrackingStatus): TrackingNotice | null {
  switch (status.kind) {
    case "starting":
    case "counting":
      return null;
    case "permissionDenied":
      return status.canAsk
        ? {
            title: "Tes pas ne sont pas comptés",
            detail: "L'appli n'a pas l'autorisation « Activité physique ». Sans elle, Guts reste immobile.",
            action: "retry",
            actionLabel: "Autoriser",
            blocking: true,
          }
        : {
            title: "Tes pas ne sont pas comptés",
            detail:
              "L'autorisation « Activité physique » est bloquée. Active-la dans les réglages du téléphone, rubrique Autorisations.",
            action: "openSettings",
            actionLabel: "Ouvrir les réglages",
            blocking: true,
          };
    case "sensorUnavailable":
      return {
        title: "Pas de compteur de pas",
        detail: "Ce téléphone ne fournit pas de compteur de pas : l'appli ne peut pas compter ta marche.",
        action: null,
        actionLabel: null,
        blocking: true,
      };
    case "backgroundOff":
      return {
        title: "Suivi permanent arrêté",
        detail:
          "Sans l'autorisation des notifications, tes pas ne sont comptés que quand l'appli est ouverte. Autorise-les dans les réglages du téléphone.",
        action: "openSettings",
        actionLabel: "Ouvrir les réglages",
        blocking: false,
      };
    case "error":
      return {
        title: "Le comptage s'est arrêté",
        detail: "Le capteur de pas n'a pas répondu.",
        action: "retry",
        actionLabel: "Réessayer",
        blocking: true,
      };
  }
}

/** Mode test web : `?devpreview&tracking=denied` (ou blocked, nosensor, background, error) montre le message. */
export function trackingStatusFromQuery(search: string): TrackingStatus | null {
  const match = /[?&]tracking=([a-z]+)/.exec(search);
  switch (match?.[1]) {
    case "denied":
      return { kind: "permissionDenied", canAsk: true };
    case "blocked":
      return { kind: "permissionDenied", canAsk: false };
    case "nosensor":
      return { kind: "sensorUnavailable" };
    case "background":
      return { kind: "backgroundOff" };
    case "error":
      return { kind: "error" };
    default:
      return null;
  }
}
