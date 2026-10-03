import { buildReminderContent, planReminderDates } from "../eveningReminder";

describe("planReminderDates", () => {
  it("programme ce soir et les deux suivants quand l'heure n'est pas passée", () => {
    const dates = planReminderDates(new Date(2026, 9, 3, 10, 0), 20, false);
    expect(dates).toEqual([new Date(2026, 9, 3, 20), new Date(2026, 9, 4, 20), new Date(2026, 9, 5, 20)]);
  });

  it("saute ce soir quand l'objectif est atteint", () => {
    const dates = planReminderDates(new Date(2026, 9, 3, 10, 0), 20, true);
    expect(dates).toEqual([new Date(2026, 9, 4, 20), new Date(2026, 9, 5, 20), new Date(2026, 9, 6, 20)]);
  });

  it("saute ce soir quand l'heure est passée", () => {
    const dates = planReminderDates(new Date(2026, 9, 3, 21, 30), 20, false);
    expect(dates[0]).toEqual(new Date(2026, 9, 4, 20));
    expect(dates).toHaveLength(3);
  });

  it("passe le mois et l'année", () => {
    const dates = planReminderDates(new Date(2026, 11, 31, 22, 0), 20, false);
    expect(dates[0]).toEqual(new Date(2027, 0, 1, 20));
  });
});

describe("buildReminderContent", () => {
  it("parle de la série quand il y en a une", () => {
    expect(buildReminderContent(5).body).toContain("5 jours");
  });

  it("reste simple sans série", () => {
    expect(buildReminderContent(0).body).not.toContain("série");
    expect(buildReminderContent(1).body).not.toContain("série");
  });
});
