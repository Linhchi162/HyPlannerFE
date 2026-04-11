import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Pencil } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  RootStackParamList,
  VendorStackParamList,
} from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  deletePromotion,
  logPromotionError,
  Promotion,
  subscribeVendorPromotions,
  updatePromotion,
} from "../../service/promotionService";
import { auth } from "../../service/firebase";

type Nav = StackNavigationProp<RootStackParamList & VendorStackParamList>;

const sectionLabel = (s: Promotion["section"]) =>
  s === "dress" ? "Váy cưới" : "Hot deal";

const toDate = (v: unknown): Date | null => {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
};

const formatValidity = (p: Promotion): string => {
  const from = toDate(p.validFrom);
  const to = toDate(p.validTo);
  if (!from && !to) return "Chưa đặt thời hạn";
  const f = from ? from.toLocaleDateString("vi-VN") : "?";
  const t = to ? to.toLocaleDateString("vi-VN") : "?";
  return `Hiệu lực: ${f} - ${t}`;
};

export default function VendorPromotionsScreen() {
  const navigation = useNavigation<Nav>();
  const uid = auth.currentUser?.uid;
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeVendorPromotions(uid, (data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const onToggleActive = async (p: Promotion, value: boolean) => {
    try {
      setTogglingId(p.id);
      await updatePromotion(p.id, { active: value });
    } catch {
      Alert.alert("Lỗi", "Không cập nhật được trạng thái hiển thị.");
    } finally {
      setTogglingId(null);
    }
  };

  const onDelete = (p: Promotion) => {
    Alert.alert("Xóa khuyến mãi", `Xóa “${p.title}”?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePromotion(p.id);
          } catch (e) {
            logPromotionError("VendorPromotionsScreen.onDelete", e);
            Alert.alert("Lỗi", "Không xóa được.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={["top"]}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={pinkHeaderStyles.titleContainer}>
            <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
              Khuyến mãi
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("VendorPromotionEdit", {})}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#f7577c" />
              <Text style={styles.muted}>Đang tải...</Text>
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.muted}>
              Chưa có khuyến mãi. Chạm + để tạo — hiển thị trên màn Ưu đãi của
              khách khi bật “Hiển thị”.
            </Text>
          ) : (
            items.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardRow}>
                  {p.imageUrl ? (
                    <Image
                      source={{ uri: p.imageUrl }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text style={styles.thumbText}>KM</Text>
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {sectionLabel(p.section)} ·{" "}
                      {p.active ? "Đang hiển thị" : "Đang ẩn"}
                    </Text>
                    <Text style={styles.cardMeta}>{formatValidity(p)}</Text>
                    {p.description?.trim() ? (
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {p.description.trim()}
                      </Text>
                    ) : null}
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Hiển thị</Text>
                      <Switch
                        value={p.active}
                        onValueChange={(v) => onToggleActive(p, v)}
                        disabled={togglingId === p.id}
                        trackColor={{ false: "#d1d5db", true: "#f9a8c4" }}
                        thumbColor={p.active ? "#f7577c" : "#f3f4f6"}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      navigation.navigate("VendorPromotionEdit", {
                        promotionId: p.id,
                      })
                    }
                  >
                    <Pencil size={16} color="#f7577c" />
                    <Text style={styles.actionText}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.dangerOutline]}
                    onPress={() => onDelete(p)}
                  >
                    <Text style={styles.dangerText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: { flex: 1, backgroundColor: "#f7577c" },
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#f7577c",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    minHeight: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontFamily: "Roboto",
    fontSize: responsiveFont(18),
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(12),
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: responsiveHeight(24),
    gap: responsiveHeight(8),
  },
  muted: {
    fontSize: responsiveFont(13),
    color: "#6b7280",
    textAlign: "center",
    marginTop: responsiveHeight(8),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardRow: { flexDirection: "row", gap: responsiveWidth(10) },
  thumb: {
    width: responsiveWidth(72),
    height: responsiveWidth(72),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#f3f4f6",
  },
  thumbPlaceholder: {
    width: responsiveWidth(72),
    height: responsiveWidth(72),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#fce7f0",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#f7577c",
    fontSize: responsiveFont(12),
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  cardMeta: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(11),
    color: "#6b7280",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(8),
  },
  switchLabel: {
    fontSize: responsiveFont(12),
    color: "#374151",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    marginTop: responsiveHeight(10),
    gap: responsiveWidth(10),
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
    borderWidth: 1,
    borderColor: "#f7577c",
    paddingVertical: responsiveHeight(8),
    borderRadius: responsiveWidth(10),
  },
  actionText: {
    color: "#f7577c",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
  },
  dangerOutline: {
    borderColor: "#dc2626",
    flex: 0,
    paddingHorizontal: responsiveWidth(16),
  },
  dangerText: {
    color: "#dc2626",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
  },
});
