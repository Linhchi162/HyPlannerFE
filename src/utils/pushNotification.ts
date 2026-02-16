import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import logger from "./logger";

// Configure how notifications are displayed when app is in foreground
// (để bạn thấy "hiện ngoài app" cả khi đang mở app)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF6B9D",
  });
}

/**
 * Request permission and get push notification token
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  let token;

  await ensureAndroidChannel();

  if (Device.isDevice) {
    const granted = await ensurePermission();
    if (!granted) {
      logger.log("Failed to get push token for push notification!");
      return;
    }

    // Get Expo Push Token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (error) {
      logger.error("Error getting push token:", error);
    }
  } else {
    logger.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Get FCM token (Android) / APNs token (iOS)
 * Use with Firebase Cloud Messaging directly.
 */
export async function getFcmTokenAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    logger.log("Must use physical device for Push Notifications");
    return undefined;
  }

  const granted = await ensurePermission();
  if (!granted) return undefined;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data;
  } catch (error) {
    logger.error("Error getting device push token:", error);
    return undefined;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds: number = 0
) {
  await ensureAndroidChannel();
  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

/**
 * Show immediate notification
 */
export async function showNotification(
  title: string,
  body: string,
  data?: any
) {
  await scheduleLocalNotification(title, body, data, 0);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add notification received listener
 * Called when a notification is received while app is in foreground
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener
 * Called when user taps on a notification
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Remove notification subscription
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
) {
  Notifications.removeNotificationSubscription(subscription);
}
