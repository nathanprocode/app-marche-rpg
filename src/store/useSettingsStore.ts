import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { DAILY_GOAL_OPTIONS, DEFAULT_DAILY_GOAL } from "../core/constants/game";
import { DEFAULT_REMINDER_HOUR, REMINDER_HOUR_OPTIONS } from "../features/reminders/eveningReminder";

const SETTINGS_STORAGE_KEY = "marche-du-faucon:settings";

type Settings = {
  /** Pas par jour pour apaiser la Marque. */
  dailyGoal: number;
  eveningReminderEnabled: boolean;
  eveningReminderHour: number;
};

type SettingsState = Settings & {
  isHydrated: boolean;
  hydrateSettings: () => Promise<void>;
  setDailyGoal: (steps: number) => void;
  setEveningReminderEnabled: (enabled: boolean) => void;
  setEveningReminderHour: (hour: number) => void;
};

const DEFAULTS: Settings = {
  dailyGoal: DEFAULT_DAILY_GOAL,
  eveningReminderEnabled: false,
  eveningReminderHour: DEFAULT_REMINDER_HOUR,
};

/** Relit des réglages dont on ne connaît pas la forme : une valeur inconnue retombe sur le défaut. */
export function parseSettings(raw: unknown): Settings {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const goal = Number(data.dailyGoal);
  const hour = Number(data.eveningReminderHour);

  return {
    dailyGoal: (DAILY_GOAL_OPTIONS as readonly number[]).includes(goal) ? goal : DEFAULTS.dailyGoal,
    eveningReminderEnabled: data.eveningReminderEnabled === true,
    eveningReminderHour: (REMINDER_HOUR_OPTIONS as readonly number[]).includes(hour) ? hour : DEFAULTS.eveningReminderHour,
  };
}

function persist(settings: Settings): void {
  AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch((error) => {
    console.log("[SettingsStore] unable to save settings", error);
  });
}

function pickSettings(state: SettingsState): Settings {
  return {
    dailyGoal: state.dailyGoal,
    eveningReminderEnabled: state.eveningReminderEnabled,
    eveningReminderHour: state.eveningReminderHour,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  isHydrated: false,
  hydrateSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      set({ ...parseSettings(stored ? JSON.parse(stored) : null), isHydrated: true });
    } catch (error) {
      console.log("[SettingsStore] unable to read settings", error);
      set({ isHydrated: true });
    }
  },
  setDailyGoal: (steps) => {
    set({ dailyGoal: parseSettings({ dailyGoal: steps }).dailyGoal });
    persist(pickSettings(get()));
  },
  setEveningReminderEnabled: (enabled) => {
    set({ eveningReminderEnabled: enabled });
    persist(pickSettings(get()));
  },
  setEveningReminderHour: (hour) => {
    set({ eveningReminderHour: parseSettings({ eveningReminderHour: hour }).eveningReminderHour });
    persist(pickSettings(get()));
  },
}));
