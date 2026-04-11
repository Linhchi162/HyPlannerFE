import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  ClipboardList,
} from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { RootStackParamList } from "../../navigation/types";
import { getPhases } from "../../service/phaseService";
import { evaluateChecklistAutoAlerts } from "../../utils/checklistAutoAlerts";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
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
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { weddingEventId } = route.params as { weddingEventId: string };
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const phases = useSelector(
    (s: RootState) => s.phases.getPhases.phases
  );
  const weddingEvent = useSelector(
    (s: RootState) => s.weddingEvent.getWeddingEvent.weddingEvent
  );

  const [hiddenChecklistIds, setHiddenChecklistIds] = useState<
    Set<string>
  >(() => new Set());

  // Chỉ đặt StatusBar khi màn này focus; không reset trong cleanup để màn đích tự set
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor("#f7577c");
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") StatusBar.setTranslucent(false);
      getPhases(weddingEventId, dispatch).catch(() => {});
      return () => {};
    }, [weddingEventId, dispatch])
  );

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checklistAlerts = useMemo(() => {
    if (weddingEvent?._id !== weddingEventId) return [];
    return evaluateChecklistAutoAlerts(
      phases,
      weddingEvent?.timeToMarried
    );
  }, [phases, weddingEvent, weddingEventId]);

  const checklistNotifs: NotificationData[] = useMemo(
    () =>
      checklistAlerts.map((a) => ({
        _id: `checklist-${a.key}`,
        type: "checklist_auto",
        title: a.title,
        message: a.body,
        isRead: true,
        priority: "high",
        createdAt: new Date().toISOString(),
      })),
    [checklistAlerts]
  );

  const mergedNotifications = useMemo(() => {
    const cl = checklistNotifs.filter((n) => !hiddenChecklistIds.has(n._id));
    return [...cl, ...notifications];
  }, [checklistNotifs, notifications, hiddenChecklistIds]);

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
    if (notificationId.startsWith("checklist-")) return;
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

  const handleDeleteAll = async () => {
    try {
      setHiddenChecklistIds(() => {
        const next = new Set<string>();
        checklistAlerts.forEach((a) => next.add(`checklist-${a.key}`));
        return next;
      });
      // Delete all without confirm: mark all read then delete read notifications
      await notificationService.markAllAsRead(weddingEventId);
      await notificationService.deleteReadNotifications(weddingEventId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error: any) {
      console.error("Error deleting all notifications:", error);
      Alert.alert("Lỗi", error.message || "Không thể xóa tất cả thông báo");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (notificationId.startsWith("checklist-")) {
      setHiddenChecklistIds((prev) => new Set(prev).add(notificationId));
      return;
    }
    try {
      const notif = notifications.find((n) => n._id === notificationId);
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      if (notif && !notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      Alert.alert("Lỗi", error.message || "Không thể xóa thông báo");
    }
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
      case "checklist_auto":
        return <ClipboardList size={24} color="#f59e0b" />;
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

  const onNotificationPress = (item: NotificationData) => {
    if (item._id.startsWith("checklist-")) {
      navigation.navigate("ChecklistAiInsight");
      return;
    }
    handleMarkAsRead(item._id);
  };

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.notificationUnread,
      ]}
      onPress={() => onNotificationPress(item)}
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
          {item.type === "checklist_auto"
            ? "Theo tiến độ checklist"
            : getTimeAgo(item.createdAt)}
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
        Bạn sẽ nhận thông báo khi khách mời phản hồi, có cập nhật quan trọng,
        hoặc khi checklist cần chú ý (hiển thị ở đây).
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#f7577c"
          translucent={false}
        />
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + responsiveHeight(16) },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={pinkHeaderStyles.titleContainer}>
            <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
              Thông báo
            </Text>
          </View>
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
        barStyle="light-content"
        backgroundColor="#f7577c"
        translucent={false}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + responsiveHeight(8) },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View
          style={[
            pinkHeaderStyles.titleContainer,
            { paddingHorizontal: responsiveWidth(12) },
          ]}
        >
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {mergedNotifications.length > 0 ? (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleDeleteAll}
              hitSlop={10}
            >
              <Trash2 size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllReadText}>Đọc tất cả</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Notification List */}
      <FlatList
        data={mergedNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          mergedNotifications.length === 0
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(20),
    paddingVertical: responsiveHeight(16),
    backgroundColor: "#f7577c",
  },
  headerTitle: {
    fontSize: responsiveFont(20),
    fontFamily: "Roboto",
    fontWeight: "400",
    fontWeight: "800",
    color: "#ffffff",
  },
  markAllReadText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#ffffff",
  },
  headerIconBtn: {
    width: responsiveWidth(28),
    height: responsiveWidth(28),
    borderRadius: responsiveWidth(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
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
  },
  notificationUnread: {
    backgroundColor: "#fff6f8",
    borderColor: "#ffd0dc",
  },
  notificationIconContainer: {
    marginRight: responsiveWidth(12),
    paddingTop: responsiveHeight(2),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(15),
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  notificationMessage: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveHeight(20),
    marginBottom: responsiveHeight(6),
  },
  notificationTime: {
    fontFamily: "Roboto",
    fontWeight: "400",
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
    backgroundColor: "#f7577c",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(40),
  },
  emptyTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(8),
  },
  emptyMessage: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    textAlign: "center",
    lineHeight: responsiveHeight(22),
  },
});

export default NotificationListScreen;
