import { HISTORY_KEEP_DAYS, historySpanDays, lastDays, pruneHistory, shiftDay, summarizeDays, toDayKey } from "../weekHistory";

// Vendredi 2 octobre 2026.
const TODAY = new Date(2026, 9, 2, 15, 30);

describe("toDayKey / shiftDay", () => {
  it("donne le jour local et passe les changements de mois", () => {
    expect(toDayKey(TODAY)).toBe("2026-10-02");
    expect(toDayKey(shiftDay(TODAY, -2))).toBe("2026-09-30");
  });
});

describe("lastDays", () => {
  const history = { "2026-09-30": 4000, "2026-10-02": 800 };

  it("renvoie 7 jours, du plus ancien à aujourd'hui", () => {
    const days = lastDays(history, TODAY);
    expect(days.map((day) => day.dayKey)).toEqual([
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ]);
    expect(days[6].isToday).toBe(true);
    expect(days[6].weekday).toBe("ven.");
    expect(days[0].weekday).toBe("sam.");
  });

  it("compte 0 pas pour un jour sans donnée et convertit en km", () => {
    const days = lastDays(history, TODAY);
    expect(days[5].steps).toBe(0);
    expect(days[4].km).toBeCloseTo(3, 5);
  });
});

describe("summarizeDays", () => {
  it("additionne les km, trouve le meilleur jour et compte les jours apaisés", () => {
    const days = lastDays({ "2026-09-30": 4000, "2026-10-01": 1500, "2026-10-02": 800 }, TODAY);
    const summary = summarizeDays(days, 1500);
    expect(summary.totalKm).toBeCloseTo((6300 * 0.75) / 1000, 5);
    expect(summary.bestDay?.dayKey).toBe("2026-09-30");
    expect(summary.calmDays).toBe(2);
  });

  it("n'a pas de meilleur jour sans aucun pas", () => {
    expect(summarizeDays(lastDays({}, TODAY)).bestDay).toBeNull();
  });
});

describe("pruneHistory", () => {
  it(`garde les ${HISTORY_KEEP_DAYS} derniers jours`, () => {
    const oldestKept = toDayKey(shiftDay(TODAY, -(HISTORY_KEEP_DAYS - 1)));
    const tooOld = toDayKey(shiftDay(TODAY, -HISTORY_KEEP_DAYS));
    const pruned = pruneHistory({ [tooOld]: 10, [oldestKept]: 20, "2026-10-02": 30 }, TODAY);
    expect(pruned).toEqual({ [oldestKept]: 20, "2026-10-02": 30 });
  });
});

describe("historySpanDays", () => {
  it("vaut 1 sans historique", () => {
    expect(historySpanDays({}, TODAY)).toBe(1);
  });

  it("compte depuis le premier jour enregistré, aujourd'hui compris", () => {
    expect(historySpanDays({ "2026-10-02": 100 }, TODAY)).toBe(1);
    expect(historySpanDays({ "2026-09-26": 100, "2026-10-01": 50 }, TODAY)).toBe(7);
  });

  it("ne dépasse pas la durée conservée", () => {
    expect(historySpanDays({ "2020-01-01": 100 }, TODAY)).toBe(HISTORY_KEEP_DAYS);
  });
});
