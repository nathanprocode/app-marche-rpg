import { formatDecimal, formatInt } from "../format";

describe("formatInt", () => {
  it("sépare les milliers par une espace insécable", () => {
    expect(formatInt(81_866)).toBe("81 866");
    expect(formatInt(1_500)).toBe("1 500");
    expect(formatInt(620)).toBe("620");
    expect(formatInt(0)).toBe("0");
  });

  it("arrondit à l'entier", () => {
    expect(formatInt(31_466.7)).toBe("31 467");
  });
});

describe("formatDecimal", () => {
  it("utilise la virgule décimale", () => {
    expect(formatDecimal(61.4)).toBe("61,4");
    expect(formatDecimal(23.6)).toBe("23,6");
    expect(formatDecimal(4.86, 2)).toBe("4,86");
  });

  it("groupe aussi les milliers", () => {
    expect(formatDecimal(1000, 1)).toBe("1 000,0");
  });
});
