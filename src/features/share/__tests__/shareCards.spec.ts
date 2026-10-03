import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { ACHIEVEMENTS } from "../../achievements/achievements";
import { buildAchievementCard, buildCheckpointCard, buildFinaleCard, buildProgressCard } from "../shareCards";

const progress = { totalSteps: 90_822, bestStreak: 5, lap: 1 };

describe("cartes à partager", () => {
  it("habillent un point franchi, avec sa planche et un texte de repli", () => {
    const checkpoint = BERSERK_CHECKPOINTS[3];
    const image = 42;
    const card = buildCheckpointCard(checkpoint, progress, image);
    expect(card.title).toBe(checkpoint.title);
    expect(card.kicker).toBe(checkpoint.arc);
    expect(card.image).toBe(image);
    expect(card.stats).toHaveLength(2);
    expect(card.text).toContain(checkpoint.title);
  });

  it("indiquent le tour à partir du deuxième", () => {
    const checkpoint = BERSERK_CHECKPOINTS[3];
    expect(buildCheckpointCard(checkpoint, { ...progress, lap: 2 }).kicker).toContain("tour 2");
    expect(buildFinaleCard(checkpoint, { ...progress, lap: 3 }).kicker).toContain("tour 3");
  });

  it("racontent un succès", () => {
    const card = buildAchievementCard(ACHIEVEMENTS[0], progress);
    expect(card.title).toBe(ACHIEVEMENTS[0].title);
    expect(card.subtitle).toBe(ACHIEVEMENTS[0].description);
  });

  it("résument la progression et choisissent la bonne série", () => {
    const base = { totalKm: 68.1, lap: 1, bestStreak: 9, totalSteps: 90_822, arc: "Âge d'Or" };
    const running = buildProgressCard({ ...base, streakDays: 3 });
    expect(running.stats[1]).toEqual({ label: "Série en cours", value: "3 jours" });
    const idle = buildProgressCard({ ...base, streakDays: 0 });
    expect(idle.stats[1]).toEqual({ label: "Meilleure série", value: "9 jours" });
  });
});
