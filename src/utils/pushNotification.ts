import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import logger from "./logger";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Configure how notifications are displayed when app is in foreground
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permission and get push notification token
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  // Skip in Expo Go
  if (isExpoGo) {
    logger.warn(
      "Push notifications not available in Expo Go. Build a development build to test."
    );
    return undefined;
  }

  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B9D",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
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
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds: number = 0
) {
  if (isExpoGo) {
    logger.warn("Local notifications not available in Expo Go");
    return;
  }

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
  if (isExpoGo) return;
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  if (isExpoGo) return 0;
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number) {
  if (isExpoGo) return;
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add notification received listener
 * Called when a notification is received while app is in foreground
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  if (isExpoGo) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener
 * Called when user taps on a notification
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  if (isExpoGo) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Remove notification subscription
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
) {
  if (isExpoGo) return;
  Notifications.removeNotificationSubscription(subscription);
}
