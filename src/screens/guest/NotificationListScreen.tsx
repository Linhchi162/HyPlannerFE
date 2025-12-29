import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Gift,
  Mail,
  Users,
  Trash2,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import * as notificationService from "../../service/notificationService";

interface NotificationData {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  data?: {
    guestId?: string;
    guestName?: string;
    previousStatus?: string;
    newStatus?: string;
    daysRemaining?: number;
  };
}

const NotificationListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { weddingEventId } = route.params as { weddingEventId: string };
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications(
        weddingEventId
      );
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông báo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [weddingEventId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [weddingEventId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(weddingEventId);

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      Alert.alert("Thành công", "Đã đánh dấu tất cả là đã đọc");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      Alert.alert("Lỗi", error.message || "Không thể đánh dấu tất cả");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert("Xóa thông báo", "Bạn có chắc chắn muốn xóa thông báo này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await notificationService.deleteNotification(notificationId);

            setNotifications((prev) =>
              prev.filter((notif) => notif._id !== notificationId)
            );
          } catch (error: any) {
            console.error("Error deleting notification:", error);
            Alert.alert("Lỗi", error.message || "Không thể xóa thông báo");
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor =
      priority === "high"
        ? "#ef4444"
        : priority === "medium"
        ? "#f59e0b"
        : "#6b7280";

    switch (type) {
      case "guest_confirmed":
        return <CheckCircle2 size={24} color="#10b981" />;
      case "guest_declined":
        return <XCircle size={24} color="#ef4444" />;
      case "table_deadline":
        return <AlertCircle size={24} color={iconColor} />;
      case "invitation_opened":
        return <Mail size={24} color="#3b82f6" />;
      case "gift_received":
        return <Gift size={24} color="#ec4899" />;
      default:
        return <Bell size={24} color={iconColor} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.notificationUnread,
      ]}
      onPress={() => handleMarkAsRead(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIconContainer}>
        {getNotificationIcon(item.type, item.priority)}
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {getTimeAgo(item.createdAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item._id)}
      >
        <Trash2 size={18} color="#9ca3af" />
      </TouchableOpacity>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Không có thông báo</Text>
      <Text style={styles.emptyMessage}>
        Bạn sẽ nhận được thông báo khi khách mời phản hồi hoặc có cập nhật quan
        trọng
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + responsiveHeight(16) },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9d" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + responsiveHeight(8) },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllReadText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 24 }} />}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          notifications.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#ff6b9d"]}
            tintColor="#ff6b9d"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(20),
    paddingVertical: responsiveHeight(16),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: responsiveFont(20),
    fontFamily: "Agbalumo",
    color: "#ff6b9d",
  },
  markAllReadText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#ff6b9d",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingVertical: responsiveHeight(12),
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginVertical: responsiveHeight(6),
    padding: responsiveWidth(16),
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: "#fef3f8",
    borderColor: "#ffc9e0",
  },
  notificationIconContainer: {
    marginRight: responsiveWidth(12),
    paddingTop: responsiveHeight(2),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  notificationMessage: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveHeight(20),
    marginBottom: responsiveHeight(6),
  },
  notificationTime: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#9ca3af",
  },
  deleteButton: {
    padding: responsiveWidth(8),
  },
  unreadDot: {
    position: "absolute",
    top: responsiveHeight(20),
    right: responsiveWidth(16),
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: "#ff6b9d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(40),
  },
  emptyTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(8),
  },
  emptyMessage: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: responsiveHeight(22),
  },
});

export default NotificationListScreen;
