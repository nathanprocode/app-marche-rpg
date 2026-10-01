jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { usePedometerStore } from "../usePedometerStore";

describe("usePedometerStore.addLiveSteps", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("cumule les pas dans la journée", () => {
    jest.setSystemTime(new Date(2026, 9, 1, 10, 0));
    usePedometerStore.getState().setLiveSteps(1000);

    expect(usePedometerStore.getState().addLiveSteps(250)).toBe(1250);
    expect(usePedometerStore.getState().stepsToday).toBe(1250);
  });

  it("repart de 0 après minuit, même sans repasser au premier plan", () => {
    jest.setSystemTime(new Date(2026, 9, 1, 23, 58));
    usePedometerStore.getState().setLiveSteps(4000);

    jest.setSystemTime(new Date(2026, 9, 2, 0, 3));
    expect(usePedometerStore.getState().addLiveSteps(120)).toBe(120);
    expect(usePedometerStore.getState().dayKey).toBe("2026-10-02");
  });
});
