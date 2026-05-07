import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { calculateGutsPosition } from "../mapJourney/interpolation";
import { stepsToKm } from "./service";

export const BACKGROUND_PEDOMETER_TASK = "BACKGROUND_PEDOMETER_TASK";

const TRACKING_CHANNEL_ID = "marche-du-faucon-tracking";
let trackingNotificationId: string | null = null;
let isNotificationHandlerReady = false;

type TrackingNotificationPayload = {
  stepsToday: number;
  totalSteps: number;
};

function getChapterTitle(totalKm: number): string {
  const position = calculateGutsPosition(totalKm, BERSERK_CHECKPOINTS);
  const arc = position.previous.arc;
  const prefix = arc.toLocaleLowerCase().startsWith("âge") ? "de l'" : "de ";
  return `🌑 Arc ${prefix}${arc}`;
}

function ensureNotificationHandler(): void {
  if (isNotificationHandlerReady) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });
  isNotificationHandlerReady = true;
}

export async function configurePersistentTrackingNotificationsAsync(): Promise<void> {
  ensureNotificationHandler();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
      name: "Marche du Faucon",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: null,
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

export async function updatePersistentTrackingNotificationAsync({
  stepsToday,
  totalSteps,
}: TrackingNotificationPayload): Promise<void> {
  await configurePersistentTrackingNotificationsAsync();

  const todayKm = stepsToKm(stepsToday);
  const totalKm = stepsToKm(totalSteps);
  const title = getChapterTitle(totalKm);
  const body = `Aujourd'hui : ${todayKm.toFixed(2)} km | Total : ${totalKm.toFixed(2)} km`;

  if (trackingNotificationId) {
    await Notifications.dismissNotificationAsync(trackingNotificationId);
  }

  const trigger = Platform.OS === "android" ? ({ channelId: TRACKING_CHANNEL_ID } as any) : null;

  trackingNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        kind: "marche-du-faucon-tracking",
      },
    } as any,
    trigger,
  });
}

export async function clearPersistentTrackingNotificationAsync(): Promise<void> {
  if (!trackingNotificationId) {
    return;
  }

  await Notifications.dismissNotificationAsync(trackingNotificationId);
  trackingNotificationId = null;
}

TaskManager.defineTask(BACKGROUND_PEDOMETER_TASK, async ({ error }: any) => {
  if (error) {
    console.log("[BACKGROUND_PEDOMETER_TASK] error", error);
    return;
  }

  console.log("[BACKGROUND_PEDOMETER_TASK] invoked");
});

export async function registerBackgroundPedometerTaskAsync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_PEDOMETER_TASK);
  if (!isRegistered) {
    await Notifications.registerTaskAsync(BACKGROUND_PEDOMETER_TASK);
  }
}

export async function unregisterBackgroundPedometerTaskAsync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_PEDOMETER_TASK);
  if (isRegistered) {
    await Notifications.unregisterTaskAsync(BACKGROUND_PEDOMETER_TASK);
  }
}
