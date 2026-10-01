import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { ARC_TITLES, buildTrackingNotificationContent } from "../trackingNotification";

const stepsForKm = (km: number) => Math.ceil((km * 1000) / 0.75);

describe("buildTrackingNotificationContent", () => {
  it("écrit les distances à la française", () => {
    const { text } = buildTrackingNotificationContent(2000, stepsForKm(1234.5));
    expect(text).toBe("Aujourd'hui : 1,50 km | Total : 1 234,50 km");
  });

  // Mêmes titres que le service natif (resolveNotificationTitle), qui prend le relais app fermée.
  it.each([
    [0, "🌑 Arc de l'Âge d'Or"],
    [350, "🌑 Arc du Guerrier Noir"],
    [460, "🌑 Arc des Châtiments"],
    [590, "🌑 Arc du Faucon Millénaire"],
    [890, "🌑 Arc Fantasia"],
  ])("titre à %i km : %s", (km, title) => {
    expect(buildTrackingNotificationContent(0, stepsForKm(km)).title).toBe(title);
  });

  it("a un titre pour chaque arc des checkpoints", () => {
    BERSERK_CHECKPOINTS.forEach((checkpoint) => expect(Object.keys(ARC_TITLES)).toContain(checkpoint.arc));
  });
});
