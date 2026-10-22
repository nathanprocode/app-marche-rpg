import { overlaps, placeLabels, type Box } from "../labelPlacement";

const box = (left: number, top: number, width = 100, height = 30): Box => ({ left, top, right: left + width, bottom: top + height });

describe("overlaps", () => {
  it("ne compte pas deux rectangles qui se touchent seulement par un bord", () => {
    expect(overlaps(box(0, 0), box(100, 0))).toBe(false);
    expect(overlaps(box(0, 0), box(50, 10))).toBe(true);
  });
});

describe("placeLabels", () => {
  it("garde la place préférée quand elle est libre", () => {
    expect(placeLabels([{ id: "next", candidates: [box(0, 0), box(0, 100)], required: true }], [])).toEqual({ next: 0 });
  });

  it("évite Guts en prenant la place suivante", () => {
    const guts = box(20, 0, 40, 60);
    expect(placeLabels([{ id: "next", candidates: [box(0, 10), box(0, 100)], required: true }], [guts])).toEqual({ next: 1 });
  });

  it("n'empile pas deux étiquettes : la seconde se décale", () => {
    const placement = placeLabels(
      [
        { id: "previous", candidates: [box(0, 50)], required: true },
        { id: "friend", candidates: [box(10, 60), box(10, 90)], required: false },
      ],
      [],
    );
    expect(placement).toEqual({ previous: 0, friend: 1 });
  });

  it("masque une étiquette d'ami sans place, mais garde celle d'un point", () => {
    const wall = box(0, 0, 500, 500);
    expect(
      placeLabels(
        [
          { id: "next", candidates: [box(0, 10)], required: true },
          { id: "friend", candidates: [box(0, 40)], required: false },
        ],
        [wall],
      ),
    ).toEqual({ next: 0, friend: null });
  });
});
