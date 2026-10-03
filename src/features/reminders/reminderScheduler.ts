import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { buildReminderContent, planReminderDates } from "./eveningReminder";

const REMINDER_CHANNEL_ID = "marche-du-faucon-reminder";
const REMINDER_KIND = "evening-reminder";

async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Rappel du soir",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Demande l'autorisation de notifier (sans effet si déjà accordée). Renvoie true si on peut notifier. */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch (error) {
    console.log("[Reminder] permission unavailable", error);
    return false;
  }
}

async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.kind === REMINDER_KIND)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

export type ReminderPlan = {
  enabled: boolean;
  hour: number;
  goalReachedToday: boolean;
  streakDays: number;
};

/**
 * Reprogramme les rappels des prochains soirs (les anciens sont annulés d'abord).
 * À rappeler quand le réglage change, quand l'objectif du jour est atteint et à chaque ouverture de l'app.
 */
export async function syncEveningReminder({ enabled, hour, goalReachedToday, streakDays }: ReminderPlan): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await cancelReminders();
    if (!enabled) return;

    await ensureReminderChannel();
    const { title, body } = buildReminderContent(streakDays);
    for (const date of planReminderDates(new Date(), hour, goalReachedToday)) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { kind: REMINDER_KIND } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: REMINDER_CHANNEL_ID },
      });
    }
  } catch (error) {
    console.log("[Reminder] unable to schedule", error);
  }
}
