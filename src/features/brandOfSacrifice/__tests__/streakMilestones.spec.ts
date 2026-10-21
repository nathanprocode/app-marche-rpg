import { nextStreakMilestone } from "../streakMilestones";

describe("nextStreakMilestone", () => {
  it("vise le palier strictement au-dessus de la série", () => {
    expect(nextStreakMilestone(0)).toBe(3);
    expect(nextStreakMilestone(3)).toBe(7);
    expect(nextStreakMilestone(99)).toBe(100);
  });

  it("n'a plus de palier après le dernier", () => {
    expect(nextStreakMilestone(365)).toBeNull();
  });
});
