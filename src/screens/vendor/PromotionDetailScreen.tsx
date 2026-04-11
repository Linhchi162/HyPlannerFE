import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  formatPromotionValidityHint,
  getPromotion,
  type Promotion,
} from "../../service/promotionService";
import { subscribeVendorProfile } from "../../service/vendorService";
import {
  getSavedPromotionIdSet,
  toggleSavedPromotion,
} from "../../service/savedPromotionsService";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";

type Nav = StackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, "PromotionDetail">;
type TabKey = "detail" | "guide";

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
}

function calcDaysLeft(validTo: unknown): number | null {
  const end = toDate(validTo);
  if (!end) return null;
  const today = new Date();
  const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endDay.getTime() - startDay.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days;
}

export default function PromotionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const promotionId = route.params?.promotionId;

  const [loading, setLoading] = useState(true);
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabKey>("detail");
  const [vendorImageUrl, setVendorImageUrl] = useState("");

  const refresh = useCallback(async () => {
    if (!promotionId) return;
    setLoading(true);
    try {
      const [p, idSet] = await Promise.all([
        getPromotion(promotionId),
        getSavedPromotionIdSet(),
      ]);
      setPromo(p);
      setSaved(idSet.has(promotionId));
    } finally {
      setLoading(false);
    }
  }, [promotionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const vendorId = promo?.vendorId?.trim();
    if (!vendorId) {
      setVendorImageUrl("");
      return;
    }
    const unsub = subscribeVendorProfile(vendorId, (vendor) => {
      setVendorImageUrl(vendor?.imageUrl?.trim() || "");
    });
    return () => unsub();
  }, [promo?.vendorId]);

  useFocusEffect(
    useCallback(() => {
      if (!promotionId) return;
      void getSavedPromotionIdSet().then((s) => setSaved(s.has(promotionId)));
    }, [promotionId])
  );

  const onToggleSave = async () => {
    if (!promotionId) return;
    const nowSaved = await toggleSavedPromotion(promotionId);
    setSaved(nowSaved);
  };

  const daysLeft = useMemo(() => calcDaysLeft(promo?.validTo), [promo?.validTo]);
  const validityText = promo ? formatPromotionValidityHint(promo) : "";

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#ff3f6c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!promo) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ưu đãi</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="x" size={26} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingBox}>
          <Text style={styles.emptyText}>Không tìm thấy ưu đãi.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ưu đãi</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.bannerWrap}>
          <Image source={{ uri: promo.imageUrl }} style={styles.banner} resizeMode="cover" />
          <TouchableOpacity style={styles.heartBtn} onPress={() => void onToggleSave()}>
            {saved ? (
              <AntDesign name="heart" size={18} color="#ff3f6c" />
            ) : (
              <Feather name="heart" size={18} color="#ff3f6c" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.vendorRow}>
          <View style={styles.vendorBadge}>
            {vendorImageUrl ? (
              <Image source={{ uri: vendorImageUrl }} style={styles.vendorBadgeImage} resizeMode="cover" />
            ) : (
              <Text style={styles.vendorBadgeText}>
                {(promo.vendorName || "?").slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>{promo.title.toUpperCase()}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.validity}>Hiệu lực: {validityText}</Text>
          {daysLeft != null ? (
            <View style={styles.daysPill}>
              <Text style={styles.daysText}>
                {daysLeft >= 0 ? `Còn ${daysLeft} ngày` : "Hết hạn"}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "detail" && styles.tabBtnActive]}
            onPress={() => setTab("detail")}
          >
            <Text style={[styles.tabText, tab === "detail" && styles.tabTextActive]}>
              Chi tiết ưu đãi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "guide" && styles.tabBtnActive]}
            onPress={() => setTab("guide")}
          >
            <Text style={[styles.tabText, tab === "guide" && styles.tabTextActive]}>
              Hướng dẫn sử dụng
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyBox}>
          {tab === "detail" ? (
            <Text style={styles.bodyText}>
              {promo.description?.trim()
                ? promo.description.trim()
                : "Nhà cung cấp chưa cập nhật chi tiết ưu đãi."}
            </Text>
          ) : (
            <View />
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate("VendorDetail", {
              vendorId: promo.vendorId,
              promotionId: promo.id,
            })
          }
        >
          <Text style={styles.primaryBtnText}>Dùng ưu đãi tại nhà cung cấp</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(18),
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(14),
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(22),
    color: "#ff3f6c",
  },
  scroll: { flex: 1, backgroundColor: "#fff7fa" },
  content: {
    paddingBottom: responsiveHeight(28),
  },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    color: "#6b7280",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(13),
  },
  bannerWrap: {
    marginHorizontal: responsiveWidth(12),
    borderRadius: responsiveWidth(12),
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f4f4f5",
  },
  banner: {
    width: "100%",
    aspectRatio: 2.05,
  },
  heartBtn: {
    position: "absolute",
    right: responsiveWidth(10),
    top: responsiveHeight(10),
    width: responsiveWidth(34),
    height: responsiveWidth(34),
    borderRadius: responsiveWidth(17),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorRow: {
    marginHorizontal: responsiveWidth(24),
    marginTop: responsiveHeight(-18),
  },
  vendorBadge: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    backgroundColor: "#0a4a8a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vendorBadgeImage: {
    width: "100%",
    height: "100%",
  },
  vendorBadgeText: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
  },
  title: {
    marginHorizontal: responsiveWidth(24),
    marginTop: responsiveHeight(14),
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(23),
    lineHeight: responsiveFont(30),
    color: "#111",
  },
  metaRow: {
    marginHorizontal: responsiveWidth(24),
    marginTop: responsiveHeight(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: responsiveWidth(12),
  },
  validity: {
    flex: 1,
    color: "#111",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(13),
  },
  daysPill: {
    backgroundColor: "#ff6b93",
    borderRadius: responsiveWidth(999),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(4),
  },
  daysText: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(11),
  },
  tabs: {
    marginTop: responsiveHeight(16),
    marginHorizontal: responsiveWidth(24),
    flexDirection: "row",
    gap: responsiveWidth(12),
  },
  tabBtn: {
    flex: 1,
    borderRadius: responsiveWidth(999),
    paddingVertical: responsiveHeight(8),
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#dff7ef" },
  tabText: {
    color: "#9ca3af",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
  },
  tabTextActive: { color: "#0f172a" },
  bodyBox: {
    marginTop: responsiveHeight(12),
    marginHorizontal: responsiveWidth(24),
    minHeight: responsiveHeight(210),
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f1e6eb",
    padding: responsiveWidth(14),
  },
  bodyText: {
    color: "#374151",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(12),
    lineHeight: responsiveFont(19),
  },
  primaryBtn: {
    marginTop: responsiveHeight(16),
    marginHorizontal: responsiveWidth(24),
    backgroundColor: "#ff3f6c",
    borderRadius: responsiveWidth(12),
    paddingVertical: responsiveHeight(12),
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(13),
  },
});
