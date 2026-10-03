import { BERSERK_CHECKPOINTS } from "../../../data/map/berserk-checkpoints";
import { ACHIEVEMENTS } from "../../achievements/achievements";
import { buildAchievementShare, buildCheckpointShare, buildFinaleShare, buildProgressShare } from "../shareMessages";

describe("textes de partage", () => {
  it("citent le point atteint et le tour à partir du deuxième", () => {
    const checkpoint = BERSERK_CHECKPOINTS[1];
    expect(buildCheckpointShare(checkpoint, 1)).toContain(checkpoint.title);
    expect(buildCheckpointShare(checkpoint, 1)).not.toContain("tour");
    expect(buildCheckpointShare(checkpoint, 2)).toContain("tour 2");
  });

  it("citent le succès", () => {
    expect(buildAchievementShare(ACHIEVEMENTS[0])).toContain(ACHIEVEMENTS[0].title);
  });

  it("résument la progression avec ou sans série en cours", () => {
    const base = { totalKm: 68.1, lap: 1, bestStreak: 5, totalSteps: 90_822, arc: "Âge d'Or" };
    expect(buildProgressShare({ ...base, streakDays: 3 })).toContain("Série en cours : 3 jours (record : 5)");
    expect(buildProgressShare({ ...base, streakDays: 0 })).toContain("Record de série : 5");
  });

  it("accordent le jour au singulier", () => {
    expect(buildFinaleShare(1_333_334, 1, 1)).toContain("1 jour");
  });
});
