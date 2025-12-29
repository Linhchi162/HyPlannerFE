import apiClient from "../api/client";

export interface NotificationData {
  guestId?: string;
  guestName?: string;
  previousStatus?: string;
  newStatus?: string;
  daysRemaining?: number;
  giftAmount?: number;
  giftDescription?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  weddingEventId: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  pushNotificationSent: boolean;
  pushNotificationSentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationStatsResponse {
  stats: Array<{
    _id: string;
    count: number;
    unreadCount: number;
  }>;
  totalUnread: number;
}

// Get all notifications for a wedding event
export const getNotifications = async (
  weddingEventId: string,
  params?: {
    isRead?: boolean;
    limit?: number;
    skip?: number;
  }
): Promise<GetNotificationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.isRead !== undefined) {
    queryParams.append("isRead", params.isRead.toString());
  }
  if (params?.limit) {
    queryParams.append("limit", params.limit.toString());
  }
  if (params?.skip) {
    queryParams.append("skip", params.skip.toString());
  }

  const response = await apiClient.get(
    `/notifications/${weddingEventId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`
  );
  return response.data;
};

// Mark a notification as read
export const markAsRead = async (
  notificationId: string
): Promise<{ message: string; notification: Notification }> => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read for a wedding event
export const markAllAsRead = async (
  weddingEventId: string
): Promise<{ message: string; count: number }> => {
  const response = await apiClient.put(
    `/notifications/${weddingEventId}/read-all`
  );
  return response.data;
};

// Delete a notification
export const deleteNotification = async (
  notificationId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Delete all read notifications for a wedding event
export const deleteReadNotifications = async (
  weddingEventId: string
): Promise<{ message: string; count: number }> => {
  const response = await apiClient.delete(
    `/notifications/${weddingEventId}/delete-read`
  );
  return response.data;
};

// Get notification statistics
export const getNotificationStats = async (
  weddingEventId: string
): Promise<NotificationStatsResponse> => {
  const response = await apiClient.get(
    `/notifications/${weddingEventId}/stats`
  );
  return response.data;
};

// Manual trigger for deadline check (admin/cron use)
export const checkDeadlines = async (): Promise<{ message: string }> => {
  const response = await apiClient.post("/notifications/check-deadlines");
  return response.data;
};
