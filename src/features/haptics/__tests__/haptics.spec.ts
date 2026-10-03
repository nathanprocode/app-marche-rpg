jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { Platform, Vibration } from "react-native";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { patternFor, vibrate } from "../haptics";

const vibrateSpy = jest.spyOn(Vibration, "vibrate").mockImplementation(() => undefined);

beforeEach(() => {
  vibrateSpy.mockClear();
  Platform.OS = "android";
  useSettingsStore.setState({ hapticsEnabled: false });
});

describe("vibrate", () => {
  it("ne vibre pas tant que l'option n'est pas activée", () => {
    vibrate("checkpoint");
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it("vibre avec le motif du moment quand l'option est activée", () => {
    useSettingsStore.setState({ hapticsEnabled: true });
    vibrate("achievement");
    expect(vibrateSpy).toHaveBeenCalledWith(patternFor("achievement"));
  });

  it("ne vibre pas sur le web", () => {
    useSettingsStore.setState({ hapticsEnabled: true });
    Platform.OS = "web";
    vibrate("finale");
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it("ne plante pas si la vibration échoue", () => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    useSettingsStore.setState({ hapticsEnabled: true });
    vibrateSpy.mockImplementationOnce(() => {
      throw new Error("no vibrator");
    });
    expect(() => vibrate("calm")).not.toThrow();
  });
});

describe("patternFor", () => {
  it("garde des vibrations brèves : la fin de Traque reste sous une seconde et demie", () => {
    (["calm", "achievement", "checkpoint", "finale"] as const).forEach((kind) => {
      const total = patternFor(kind).reduce((sum, ms) => sum + ms, 0);
      expect(total).toBeLessThan(1500);
    });
  });
});
