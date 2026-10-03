jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseSettings, useSettingsStore } from "../useSettingsStore";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("parseSettings", () => {
  it("retombe sur les défauts quand la valeur est inconnue ou abîmée", () => {
    expect(parseSettings(null)).toEqual({ dailyGoal: 1500, eveningReminderEnabled: false, eveningReminderHour: 20 });
    expect(parseSettings({ dailyGoal: 42, eveningReminderHour: 3 })).toMatchObject({
      dailyGoal: 1500,
      eveningReminderHour: 20,
    });
  });

  it("garde les valeurs proposées", () => {
    expect(parseSettings({ dailyGoal: 5000, eveningReminderEnabled: true, eveningReminderHour: 19 })).toEqual({
      dailyGoal: 5000,
      eveningReminderEnabled: true,
      eveningReminderHour: 19,
    });
  });
});

describe("useSettingsStore", () => {
  it("relit les réglages après un redémarrage", async () => {
    useSettingsStore.getState().setDailyGoal(8000);
    useSettingsStore.getState().setEveningReminderEnabled(true);
    useSettingsStore.setState({ dailyGoal: 1500, eveningReminderEnabled: false });

    await useSettingsStore.getState().hydrateSettings();
    expect(useSettingsStore.getState().dailyGoal).toBe(8000);
    expect(useSettingsStore.getState().eveningReminderEnabled).toBe(true);
  });

  it("refuse un objectif qui n'est pas proposé", () => {
    useSettingsStore.getState().setDailyGoal(123);
    expect(useSettingsStore.getState().dailyGoal).toBe(1500);
  });
});
