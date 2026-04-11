import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MessageCircle } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  subscribeVendorRequests,
  updateVendorRequestStatus,
  VendorRequest,
} from "../../service/vendorService";
import { auth } from "../../service/firebase";

type OrderFilter = "all" | "open" | "done";

function requestStatusLabel(status?: VendorRequest["status"]): string {
  if (status === "done") return "Hoàn thành";
  if (status === "in_progress") return "Đang xử lý";
  return "Mới";
}

function requestStatusBadgeStyle(status?: VendorRequest["status"]) {
  if (status === "done") return styles.badgeDone;
  if (status === "in_progress") return styles.badgeProgress;
  return styles.badgeNew;
}

export default function VendorRequestsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const isTabMode = route.name === "VendorOrders";

  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeVendorRequests(uid, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredList = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "done") return requests.filter((r) => r.status === "done");
    return requests.filter((r) => r.status !== "done");
  }, [requests, filter]);

  const formatDate = (value?: any) => {
    if (!value) return "";
    const date = typeof value?.toDate === "function" ? value.toDate() : value;
    if (!(date instanceof Date)) return "";
    return date.toLocaleDateString("vi-VN");
  };

  const openChatWithCustomer = (r: VendorRequest) => {
    const params = {
      role: "vendor" as const,
      userId: r.userId,
      userName: r.userName?.trim() ? r.userName : "Khách hàng",
    };
    if (isTabMode) {
      (navigation as any).navigate("VendorHome", {
        screen: "ChatDetail",
        params,
      });
    } else {
      (navigation as any).navigate("ChatDetail", params);
    }
  };

  const markDone = async (r: VendorRequest) => {
    try {
      setUpdatingId(r.id);
      await updateVendorRequestStatus(r.id, "done");
    } catch {
      Alert.alert("Lỗi", "Không cập nhật được trạng thái.");
    } finally {
      setUpdatingId(null);
    }
  };

  const markInProgress = async (r: VendorRequest) => {
    try {
      setUpdatingId(r.id);
      await updateVendorRequestStatus(r.id, "in_progress");
    } catch {
      Alert.alert("Lỗi", "Không cập nhật được trạng thái.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={["top"]}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          {!isTabMode ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <View style={pinkHeaderStyles.titleContainer}>
            <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
              Đơn hàng
            </Text>
          </View>
          <View style={styles.headerSideSpacer} />
        </View>

        <View style={styles.filterBar}>
          {(
            [
              { key: "all" as const, label: "Tất cả" },
              { key: "open" as const, label: "Chưa xong" },
              { key: "done" as const, label: "Hoàn thành" },
            ] as const
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filter === key && styles.filterChipOn]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === key && styles.filterChipTextOn,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#f7577c" />
              <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
            </View>
          ) : filteredList.length === 0 ? (
            <Text style={styles.emptyText}>
              {filter === "done"
                ? "Chưa có đơn đã hoàn thành."
                : filter === "open"
                  ? "Không có đơn đang mở."
                  : "Chưa có đơn hàng nào."}
            </Text>
          ) : (
            filteredList.map((r) => {
              const legacyService = (r as any).serviceName as
                | string
                | undefined;
              const isDone = r.status === "done";
              const showStartBtn =
                !isDone &&
                r.status !== "in_progress" &&
                (r.status === "new" || r.status == null);

              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.badge, requestStatusBadgeStyle(r.status)]}>
                      <Text style={styles.badgeText}>
                        {requestStatusLabel(r.status)}
                      </Text>
                    </View>
                    {r.createdAt ? (
                      <Text style={styles.cardDate}>
                        {formatDate(r.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.cardRow}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{r.userName}</Text>
                      {Array.isArray(r.services) && r.services.length > 0 ? (
                        <Text style={styles.cardSub}>
                          {r.services.map((s) => s.name).join(", ")}
                        </Text>
                      ) : legacyService ? (
                        <Text style={styles.cardSub}>{legacyService}</Text>
                      ) : null}
                      {r.note ? (
                        <Text style={styles.cardSub}>Ghi chú: {r.note}</Text>
                      ) : null}
                      {r.promotionTitle ? (
                        <Text style={styles.cardPromo}>
                          Ưu đãi: {r.promotionTitle}
                        </Text>
                      ) : r.promotionId ? (
                        <Text style={styles.cardPromo}>
                          Khách áp dụng ưu đãi (mã: {r.promotionId.slice(0, 8)}…)
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.cardActions}>
                    {isDone ? (
                      <Text style={styles.statusDone}>Đã hoàn thành</Text>
                    ) : (
                      <>
                        {showStartBtn ? (
                          <TouchableOpacity
                            style={[
                              styles.secondaryBtn,
                              updatingId === r.id && styles.btnDisabled,
                            ]}
                            disabled={updatingId === r.id}
                            onPress={() => {
                              Alert.alert(
                                "Xác nhận",
                                "Đánh dấu đơn đang được xử lý?",
                                [
                                  { text: "Hủy", style: "cancel" },
                                  {
                                    text: "Bắt đầu",
                                    onPress: () => void markInProgress(r),
                                  },
                                ]
                              );
                            }}
                          >
                            <Text style={styles.secondaryBtnText}>
                              {updatingId === r.id ? "…" : "Bắt đầu xử lý"}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          style={[
                            styles.completeBtn,
                            updatingId === r.id && styles.completeBtnDisabled,
                          ]}
                          disabled={updatingId === r.id}
                          onPress={() => {
                            Alert.alert(
                              "Xác nhận",
                              "Đánh dấu đơn đã hoàn thành? Khách chỉ được đánh giá sau khi bạn xác nhận.",
                              [
                                { text: "Hủy", style: "cancel" },
                                {
                                  text: "Hoàn thành",
                                  onPress: () => void markDone(r),
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={styles.completeBtnText}>
                            {updatingId === r.id ? "Đang lưu..." : "Hoàn thành"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => openChatWithCustomer(r)}
                    >
                      <MessageCircle size={16} color="#f7577c" />
                      <Text style={styles.chatBtnText}>Nhắn tin</Text>
                    </TouchableOpacity>
                  </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
    backgroundColor: "#f7577c",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#f7577c",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    minHeight: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSideSpacer: {
    width: responsiveWidth(24),
    height: responsiveWidth(24),
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterChip: {
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(8),
    borderRadius: responsiveWidth(20),
    backgroundColor: "#f3f4f6",
  },
  filterChipOn: {
    backgroundColor: "#f7577c",
  },
  filterChipText: {
    fontSize: responsiveFont(12),
    fontFamily: "Roboto",
    fontWeight: "500",
    color: "#4b5563",
  },
  filterChipTextOn: {
    color: "#ffffff",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(10),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(24),
  },
  loadingText: {
    marginTop: responsiveHeight(8),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    gap: responsiveHeight(10),
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(4),
    borderRadius: responsiveWidth(8),
  },
  badgeNew: {
    backgroundColor: "#dbeafe",
  },
  badgeProgress: {
    backgroundColor: "#fef3c7",
  },
  badgeDone: {
    backgroundColor: "#d1fae5",
  },
  badgeText: {
    fontSize: responsiveFont(11),
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#1f2937",
  },
  cardDate: {
    fontSize: responsiveFont(11),
    color: "#9ca3af",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  cardActions: {
    alignItems: "flex-end",
    gap: responsiveHeight(8),
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#f7577c",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(6),
  },
  secondaryBtnText: {
    color: "#f7577c",
    fontSize: responsiveFont(11),
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  completeBtn: {
    backgroundColor: "#f7577c",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(6),
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnText: {
    color: "#ffffff",
    fontSize: responsiveFont(11),
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  statusDone: {
    fontSize: responsiveFont(11),
    color: "#059669",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  cardInfo: {
    flex: 1,
    paddingRight: responsiveWidth(12),
  },
  cardTitle: {
    fontFamily: "Roboto",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  cardSub: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  cardPromo: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(12),
    color: "#f7577c",
    fontWeight: "600",
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    borderWidth: 1,
    borderColor: "#f7577c",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(6),
  },
  chatBtnText: {
    color: "#f7577c",
    fontSize: responsiveFont(12),
    fontFamily: "Roboto",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
});
