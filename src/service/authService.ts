import apiClient from "../api/client";

/**
 * Update user's Expo push notification token
 */
export const updatePushToken = async (pushToken: string): Promise<void> => {
  try {
    const response = await apiClient.post("/auth/push-token", { pushToken });
    console.log("✅ Push token updated on server:", response.data);
  } catch (error: any) {
    console.error("❌ Failed to update push token:", error?.message || error);
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
    console.log("✅ Push token removed from server:", response.data);
  } catch (error: any) {
    console.error("❌ Failed to remove push token:", error?.message || error);
    // Don't throw error on logout, just log it
  }
};
