import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import type { LocationGeocodedAddress } from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import {
  Promotion,
  PromotionCategoryDoc,
  subscribeActivePromotions,
  subscribePromotionCategories,
} from "../../service/promotionService";
import {
  normalizePromotionCategoryId,
  VENDOR_SERVICE_CATEGORIES,
} from "../../constants/vendorServiceCategories";
import {
  getSavedPromotionIdSet,
  toggleSavedPromotion,
} from "../../service/savedPromotionsService";

type Nav = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

/** Icon Feather khi chưa có ảnh danh mục từ admin */
const CATEGORY_FEATHER: Record<string, string> = {
  planner: "calendar",
  venue: "home",
  decor: "layers",
  photo: "camera",
  video: "video",
  makeup: "feather",
  "wedding-dress": "heart",
  "groom-suit": "user",
  "wedding-rings-jewelry": "diamond",
  flowers: "heart",
  invitation: "mail",
  "wedding-car": "truck",
  "mc-band": "mic",
  "tray-gift": "gift",
  "wedding-cake": "coffee",
  "sound-light": "volume-2",
  photobooth: "image",
};

const CARD_WIDTH = width * 0.56;
const SEARCH_OVERLAP = responsiveHeight(23); // nửa chiều cao search bar

function formatGeocodeLine(geo: LocationGeocodedAddress): string {
  const street = [geo.streetNumber, geo.street].filter(Boolean).join(" ").trim();
  const district = geo.district || geo.subregion;
  const city = geo.city || geo.region;
  const parts: string[] = [];
  if (street) parts.push(street);
  if (district && district !== city) parts.push(district);
  if (city) parts.push(city);
  const line = parts.join(", ").trim();
  if (line) return line;
  if (geo.name) return geo.name;
  if (geo.region) return geo.region;
  return "Vị trí hiện tại";
}

export default function PromotionDealsScreen() {
  const navigation = useNavigation<Nav>();
  const [locationLine, setLocationLine] = useState("Đang xác định vị trí…");
  const [topPanelBottom, setTopPanelBottom] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categoryDocs, setCategoryDocs] = useState<PromotionCategoryDoc[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  useFocusEffect(
    useCallback(() => {
      void getSavedPromotionIdSet().then(setSavedIds);
    }, [])
  );

  const onToggleSave = useCallback(async (promotionId: string) => {
    const nowSaved = await toggleSavedPromotion(promotionId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(promotionId);
      else next.delete(promotionId);
      return next;
    });
  }, []);

  useEffect(() => {
    const unsub = subscribeActivePromotions((list) => {
      setPromotions(list);
      setPromosLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribePromotionCategories(setCategoryDocs);
    return () => unsub();
  }, []);

  /** Chỉ danh mục đang có ít nhất một ưu đãi hiển thị */
  const visibleCategoryChips = useMemo(() => {
    const ids = new Set<string>();
    promotions.forEach((p) => {
      if (p.imageUrl) ids.add(normalizePromotionCategoryId(p.category));
    });
    const docMap = new Map(
      categoryDocs.filter((d) => d.active !== false).map((d) => [d.id, d])
    );
    const orderOf = (id: string) => {
      const d = docMap.get(id);
      if (d && typeof d.order === "number") return d.order;
      const i = VENDOR_SERVICE_CATEGORIES.findIndex((c) => c.id === id);
      return i >= 0 ? i : 999;
    };
    return Array.from(ids)
      .map((id) => {
        const def = VENDOR_SERVICE_CATEGORIES.find((c) => c.id === id);
        const doc = docMap.get(id);
        return {
          id,
          shortLabel: doc?.shortName ?? def?.short ?? id,
          iconUrl: doc?.iconUrl?.trim() ? doc.iconUrl : "",
          feather: CATEGORY_FEATHER[id] ?? "grid",
        };
      })
      .sort((a, b) => orderOf(a.id) - orderOf(b.id));
  }, [promotions, categoryDocs]);

  const filteredPromos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promotions.filter((p) => {
      const pCat = normalizePromotionCategoryId(p.category);
      const catOk = categoryFilter === "all" || pCat === categoryFilter;
      const textOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.vendorName || "").toLowerCase().includes(q);
      return catOk && textOk && p.imageUrl;
    });
  }, [promotions, searchQuery, categoryFilter]);

  const hotDealsList = useMemo(
    () => filteredPromos.filter((p) => p.section === "hot"),
    [filteredPromos]
  );

  /** Mỗi danh mục một hàng ngang. KM có thể vừa hiện ở Hot deal vừa hiện ở hàng danh mục tương ứng. */
  const promotionRowsByCategory = useMemo(() => {
    const docMap = new Map(
      categoryDocs.filter((d) => d.active !== false).map((d) => [d.id, d])
    );
    const orderOf = (id: string) => {
      const d = docMap.get(id);
      if (d && typeof d.order === "number") return d.order;
      const i = VENDOR_SERVICE_CATEGORIES.findIndex((c) => c.id === id);
      return i >= 0 ? i : 999;
    };
    const byCat = new Map<string, Promotion[]>();
    filteredPromos.forEach((p) => {
      if (!p.imageUrl) return;
      const id = normalizePromotionCategoryId(p.category);
      const arr = byCat.get(id) ?? [];
      arr.push(p);
      byCat.set(id, arr);
    });
    return Array.from(byCat.entries())
      .filter(([, items]) => items.length > 0)
      .sort(([a], [b]) => orderOf(a) - orderOf(b))
      .map(([id, items]) => {
        const def = VENDOR_SERVICE_CATEGORIES.find((c) => c.id === id);
        const doc = docMap.get(id);
        return {
          id,
          title: doc?.shortName ?? def?.short ?? id,
          items,
        };
      });
  }, [filteredPromos, categoryDocs]);

  const openPromotion = (p: Promotion) => {
    navigation.navigate("PromotionDetail", { promotionId: p.id });
  };

  const refreshLocation = useCallback(async (opts?: { promptSettings?: boolean }) => {
    setLocationLine((prev) => (prev.startsWith("Đang ") ? prev : "Đang xác định vị trí…"));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLine("Chưa cấp quyền vị trí — chạm để thử");
        if (opts?.promptSettings) {
          Alert.alert(
            "Cần quyền vị trí",
            "Bật quyền vị trí trong Cài đặt để hiển thị ưu đãi theo khu vực.",
            [
              { text: "Để sau", style: "cancel" },
              { text: "Mở cài đặt", onPress: () => void Linking.openSettings() },
            ]
          );
        }
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geo) setLocationLine(formatGeocodeLine(geo));
      else setLocationLine("Vị trí hiện tại");
    } catch (e) {
      console.error("[PromotionDeals · expo-location]", e);
      setLocationLine("Không lấy được vị trí — chạm thử lại");
      if (opts?.promptSettings) {
        Alert.alert(
          "Lỗi vị trí",
          "Không đọc được GPS hoặc địa chỉ. Kiểm tra dịch vụ định vị và thử lại.",
          [
            { text: "Đóng", style: "cancel" },
            { text: "Mở cài đặt", onPress: () => void Linking.openSettings() },
          ]
        );
      }
    }
  }, []);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ===== HEADER (white) ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ưu đãi</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.goBack()}>
          <Feather name="x" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      {/* ===== TOP PANEL (pink — chỉ location bar) ===== */}
      <View
        style={styles.topPanel}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          setTopPanelBottom(y + height - SEARCH_OVERLAP);
        }}
      >
        {/* Location row */}
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.locationLeft}
            activeOpacity={0.85}
            onPress={() => void refreshLocation({ promptSettings: true })}
          >
            <Feather name="map-pin" size={22} color="#fff" />
            <View style={styles.locationTextBlock}>
              <Text style={styles.locationLabel}>Địa điểm áp dụng</Text>
              <Text style={styles.locationValue} numberOfLines={2}>
                {locationLine}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => navigation.navigate("SavedPromotionOffers")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="heart" size={17} color="#ff3f6c" />
          </TouchableOpacity>
        </View>

        {/* Extra padding so search bar can overlap */}
        <View style={{ height: SEARCH_OVERLAP }} />
      </View>

      {/* ===== SEARCH BAR (overlaps top panel) ===== */}
      <View style={[styles.searchBarWrap, { top: topPanelBottom }]} pointerEvents="box-none">
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#ff5b83" />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor="#c5b9bf"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterDivider} />
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Bộ lọc</Text>
            <Feather name="sliders" size={17} color="#ff5b83" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== SCROLL CONTENT ===== */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Space for overlapping search bar */}
        <View style={{ height: SEARCH_OVERLAP }} />

        {/* Danh mục: chỉ hiện khi có ưu đãi */}
        {visibleCategoryChips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {visibleCategoryChips.map((c) => {
              const selected = categoryFilter === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.categoryItem}
                  onPress={() =>
                    setCategoryFilter((prev) =>
                      prev === c.id ? "all" : c.id
                    )
                  }
                >
                  <View
                    style={[
                      styles.categoryBox,
                      selected && styles.categoryBoxSelected,
                    ]}
                  >
                    {c.iconUrl ? (
                      <Image
                        source={{ uri: c.iconUrl }}
                        style={styles.categoryIconImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather
                        name={c.feather as any}
                        size={responsiveWidth(22)}
                        color="#ff3f6c"
                      />
                    )}
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={2}>
                    {c.shortLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : !promosLoading ? (
          <Text style={styles.promoEmpty}>
            Chưa có ưu đãi theo danh mục. Khi có khuyến mãi, danh mục sẽ hiện
            ở đây.
          </Text>
        ) : null}

        {/* Hot deal */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hot deal!</Text>
          <TouchableOpacity style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Tất cả</Text>
            <Feather name="chevron-right" size={16} color="#ff3f6c" />
          </TouchableOpacity>
        </View>

        {promosLoading ? (
          <View style={styles.promoLoading}>
            <ActivityIndicator color="#ff3f6c" />
          </View>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotRow}>
          {hotDealsList.length === 0 ? (
            <Text style={styles.promoEmpty}>Chưa có ưu đãi Hot deal.</Text>
          ) : (
            hotDealsList.map((item) => (
            <View key={item.id} style={styles.hotCard}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openPromotion(item)}
                style={styles.hotImageWrap}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.hotImage} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.hotFavBtn}
                  onPress={() => void onToggleSave(item.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {savedIds.has(item.id) ? (
                    <AntDesign name="heart" size={15} color="#ff3f6c" />
                  ) : (
                    <Feather name="heart" size={15} color="#ff3f6c" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openPromotion(item)} activeOpacity={0.8}>
                <Text style={styles.hotTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hotLinkRow} onPress={() => openPromotion(item)}>
                <Text style={styles.hotLinkText}>Chi tiết ưu đãi</Text>
                <Feather name="chevron-right" size={13} color="#ff3f6c" />
              </TouchableOpacity>
            </View>
            ))
          )}
        </ScrollView>
        )}

        {!promosLoading &&
          promotionRowsByCategory.map((row) => (
            <React.Fragment key={row.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{row.title}</Text>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>Xem thêm</Text>
                  <Feather name="chevron-right" size={16} color="#ff3f6c" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hotRow}
              >
                {row.items.map((item) => (
                  <View key={item.id} style={styles.hotCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => openPromotion(item)}
                      style={styles.hotImageWrap}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.hotImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.hotFavBtn}
                        onPress={() => void onToggleSave(item.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        {savedIds.has(item.id) ? (
                          <AntDesign name="heart" size={15} color="#ff3f6c" />
                        ) : (
                          <Feather name="heart" size={15} color="#ff3f6c" />
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openPromotion(item)} activeOpacity={0.8}>
                      <Text style={styles.hotTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.hotLinkRow}
                      onPress={() => openPromotion(item)}
                    >
                      <Text style={styles.hotLinkText}>Chi tiết ưu đãi</Text>
                      <Feather name="chevron-right" size={13} color="#ff3f6c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </React.Fragment>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* SafeAreaView trắng để status bar khớp header trắng; scroll content sẽ tô hồng phớt */
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

  /* TOP PANEL — chỉ pink location bar */
  topPanel: {
    backgroundColor: "#ff3f6c",
    zIndex: 1,
  },
  locationRow: {
    paddingHorizontal: responsiveWidth(14),
    paddingTop: responsiveHeight(12),
    paddingBottom: responsiveHeight(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
  },
  locationTextBlock: { flex: 1, minWidth: 0 },
  locationLabel: { color: "rgba(255,255,255,0.85)", fontFamily: "Roboto",
 fontWeight: "500", fontSize: responsiveFont(11) },
  locationValue: { color: "#fff", fontFamily: "Roboto",
 fontWeight: "600", fontSize: responsiveFont(14), marginTop: 2 },
  favBtn: {
    width: responsiveWidth(38),
    height: responsiveWidth(38),
    borderRadius: responsiveWidth(19),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  /* SEARCH OVERLAP */
  searchBarWrap: {
    position: "absolute",
    left: responsiveWidth(14),
    right: responsiveWidth(14),
    zIndex: 10,
    top: 0, // set inline via onLayout — use marginTop trick instead
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(46),
    gap: responsiveWidth(8),
    shadowColor: "#c06080",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Roboto",
    fontWeight: "500",
    color: "#333",
    fontSize: responsiveFont(14),
    paddingVertical: 0,
  },
  filterDivider: { width: 1, height: responsiveHeight(22), backgroundColor: "#e0d0d6" },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: responsiveWidth(6) },
  filterText: { fontFamily: "Roboto",
 fontWeight: "500", color: "#ff5b83", fontSize: responsiveFont(13) },

  /* SCROLL — nền hồng phớt cho toàn bộ phần nội dung */
  scroll: { flex: 1, backgroundColor: "#faedf1" },
  scrollContent: { paddingBottom: responsiveHeight(32) },

  /* CATEGORIES — chỉ danh mục có nội dung */
  categoryScroll: {
    paddingHorizontal: responsiveWidth(14),
    paddingTop: responsiveHeight(14),
    gap: responsiveWidth(10),
    alignItems: "flex-start",
  },
  categoryItem: { alignItems: "center", width: responsiveWidth(76) },
  categoryBox: {
    width: responsiveWidth(62),
    height: responsiveWidth(54),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e0b0b8",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryBoxSelected: {
    borderColor: "#ff3f6c",
    backgroundColor: "#fff5f7",
  },
  categoryIconImage: {
    width: responsiveWidth(36),
    height: responsiveWidth(36),
    borderRadius: responsiveWidth(8),
  },
  promoLoading: {
    paddingVertical: responsiveHeight(24),
    alignItems: "center",
  },
  promoEmpty: {
    paddingHorizontal: responsiveWidth(14),
    paddingVertical: responsiveHeight(12),
    color: "#888",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(12),
  },
  categoryLabel: {
    marginTop: responsiveHeight(5),
    color: "#ff3f6c",
    fontSize: responsiveFont(11),
    fontFamily: "Roboto",
    fontWeight: "500",
    textAlign: "center",
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: responsiveWidth(14),
    marginTop: responsiveHeight(18),
    marginBottom: responsiveHeight(10),
  },
  sectionTitle: {
    fontSize: responsiveFont(18),
    color: "#111",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  seeAllBtn: { flexDirection: "row", alignItems: "center" },
  seeAllText: {
    color: "#ff3f6c",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontWeight: "700",
    fontSize: responsiveFont(13),
  },

  /* HOT DEAL */
  hotRow: { gap: responsiveWidth(12), paddingHorizontal: responsiveWidth(14), paddingBottom: responsiveHeight(4) },
  hotCard: { width: CARD_WIDTH, backgroundColor: "#fff", borderRadius: responsiveWidth(12), overflow: "hidden" },
  hotImageWrap: { width: "100%", aspectRatio: 1.5, position: "relative" },
  hotImage: { width: "100%", height: "100%" },
  hotFavBtn: {
    position: "absolute",
    top: responsiveHeight(8),
    right: responsiveWidth(8),
    width: responsiveWidth(28),
    height: responsiveWidth(28),
    borderRadius: responsiveWidth(14),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  hotTitle: {
    marginHorizontal: responsiveWidth(10),
    marginTop: responsiveHeight(7),
    color: "#111",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(11),
    lineHeight: responsiveFont(16),
  },
  hotLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: responsiveWidth(10),
    marginTop: responsiveHeight(5),
    marginBottom: responsiveHeight(10),
  },
  hotLinkText: { color: "#ff3f6c", fontFamily: "Roboto",
 fontWeight: "600", fontSize: responsiveFont(11) },

});
