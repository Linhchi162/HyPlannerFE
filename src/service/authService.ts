import apiClient from "../api/client";
import logger from "../utils/logger";

/**
 * Update user's Expo push notification token
 */
export const updatePushToken = async (pushToken: string): Promise<void> => {
  try {
    const response = await apiClient.post("/auth/push-token", { pushToken });
  } catch (error: any) {
    logger.error("❌ Failed to update push token:", error?.message || error);
    throw error;
  }
};

/**
 * Remove push token from server (on logout)
 */
export const removePushToken = async (): Promise<void> => {
  try {
    const response = await apiClient.post("/auth/push-token", {
      pushToken: null,
    });
    logger.log("✅ Push token removed from server:", response.data);
  } catch (error: any) {
    logger.error("❌ Failed to remove push token:", error?.message || error);
    // Don't throw error on logout, just log it
  }
};
