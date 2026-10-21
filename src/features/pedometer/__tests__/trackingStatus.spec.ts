import { describeTrackingStatus, trackingStatusFromQuery } from "../trackingStatus";

describe("describeTrackingStatus", () => {
  it("ne dit rien quand les pas sont comptés ou au démarrage", () => {
    expect(describeTrackingStatus({ kind: "counting" })).toBeNull();
    expect(describeTrackingStatus({ kind: "starting" })).toBeNull();
  });

  it("redemande l'autorisation tant qu'Android le permet, sinon envoie vers les réglages", () => {
    expect(describeTrackingStatus({ kind: "permissionDenied", canAsk: true })?.action).toBe("retry");
    expect(describeTrackingStatus({ kind: "permissionDenied", canAsk: false })?.action).toBe("openSettings");
  });

  it("n'offre aucune action sans capteur de pas", () => {
    const notice = describeTrackingStatus({ kind: "sensorUnavailable" });
    expect(notice?.action).toBeNull();
    expect(notice?.blocking).toBe(true);
  });

  it("présente le suivi permanent arrêté comme un avertissement, pas une panne", () => {
    expect(describeTrackingStatus({ kind: "backgroundOff" })?.blocking).toBe(false);
  });
});

describe("trackingStatusFromQuery", () => {
  it("lit l'état demandé dans l'adresse du mode test", () => {
    expect(trackingStatusFromQuery("?devpreview&tracking=blocked")).toEqual({ kind: "permissionDenied", canAsk: false });
    expect(trackingStatusFromQuery("?devpreview")).toBeNull();
  });
});
