import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Star,
  MapPin,
  ChevronDown,
  MessageCircle,
  Filter,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import type { RootState } from "../../store";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  getCachedVendors,
  Vendor,
  subscribeVendors,
} from "../../service/vendorService";
import { subscribeChatsByParticipant } from "../../service/chatService";

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(raw?: string): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function averageServicePrice(vendor: Vendor): number | null {
  if (!Array.isArray(vendor.services) || vendor.services.length === 0) return null;
  const nums = vendor.services
    .map((s) => parsePrice(s?.price))
    .filter((n): n is number => typeof n === "number");
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function locationScore(vendorLocation: string, userLocation: string): number {
  if (!userLocation.trim()) return 0.5;
  const v = normalizeText(vendorLocation || "");
  const u = normalizeText(userLocation || "");
  if (!v || !u) return 0.3;
  if (v === u) return 1;
  if (v.includes(u) || u.includes(v)) return 0.9;
  const vTokens = new Set(v.split(",").map((x) => x.trim()).filter(Boolean));
  const uTokens = u.split(",").map((x) => x.trim()).filter(Boolean);
  const overlap = uTokens.some((t) => vTokens.has(t));
  return overlap ? 0.7 : 0.2;
}

function budgetScore(avgPrice: number | null, weddingBudget: number): number {
  if (!avgPrice || !Number.isFinite(weddingBudget) || weddingBudget <= 0) return 0.5;
  // Roughly assume one vendor package around 10% of total budget.
  const target = Math.max(1, weddingBudget * 0.1);
  const diff = Math.abs(Math.log(avgPrice) - Math.log(target));
  const score = Math.exp(-diff);
  return Math.max(0, Math.min(1, score));
}

function qualityScore(vendor: Vendor): number {
  const rating = Math.max(0, Math.min(5, Number(vendor.rating || 0)));
  const count = Math.max(0, Number(vendor.ratingCount || 0));
  const confidence = Math.min(1, Math.log10(count + 1) / 2);
  return (rating / 5) * confidence + (1 - confidence) * 0.5;
}

export default function VendorListScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentUser = useSelector(selectCurrentUser);
  const weddingBudget = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent.budget || 0
  );
  const weddingAddress = useSelector(
    (state: RootState) => (state.weddingEvent.getWeddingEvent.weddingEvent as any).address || ""
  );
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activeLocation, setActiveLocation] = useState("Tất cả");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [gpsLocationHint, setGpsLocationHint] = useState("");
  const [sortOption, setSortOption] = useState<
    "" | "rating-asc" | "rating-desc" | "services-asc" | "services-desc"
  >("");


  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const cached = await getCachedVendors();
        if (isMounted && cached.length > 0) {
          setVendors(cached);
        }
        const unsub = subscribeVendors((data) => {
          if (isMounted) setVendors(data);
        });
        if (isMounted) setLoading(false);
        return unsub;
      } catch {
        if (isMounted) setVendors([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    let cleanup: undefined | (() => void);
    load().then((unsub) => {
      cleanup = typeof unsub === "function" ? unsub : undefined;
    });
    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (!geo) return;
        const district = geo.district || geo.subregion || "";
        const city = geo.city || geo.region || "";
        const label = [district, city].filter(Boolean).join(", ").trim();
        const fallback = geo.name || city || district || "";
        if (mounted) setGpsLocationHint(label || fallback);
      } catch {
        // Ignore location failures and fallback to profile/wedding address.
      }
    };
    void loadCurrentLocation();
    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    const userId =
      currentUser?.id || currentUser?._id || currentUser?.uid;
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const unsub = subscribeChatsByParticipant(userId, (data) => {
      const total = data.reduce((sum, c) => sum + (c.userUnread || 0), 0);
      setUnreadCount(total);
    });
    return () => unsub();
  }, [currentUser]);

  const categories = useMemo(() => {
    const uniq = Array.from(
      new Set(vendors.map((v) => v.category).filter(Boolean))
    );
    return ["Tất cả", ...uniq];
  }, [vendors]);

  const locations = useMemo(() => {
    const uniq = Array.from(
      new Set(vendors.map((v) => v.location).filter(Boolean))
    );
    return ["Tất cả", ...uniq];
  }, [vendors]);

  const filteredCategories = useMemo(() => {
    if (!categoryQuery.trim()) return categories;
    const q = categoryQuery.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, categoryQuery]);

  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return locations;
    const q = locationQuery.toLowerCase();
    return locations.filter((l) => l.toLowerCase().includes(q));
  }, [locations, locationQuery]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const hasPublicProfile =
        (v.description && v.description.trim().length > 0) &&
        Array.isArray(v.services) &&
        v.services.length > 0;
      const matchCategory =
        activeCategory === "Tất cả" || v.category === activeCategory;
      const matchLocation =
        activeLocation === "Tất cả" || v.location === activeLocation;
      const matchQuery =
        query.trim().length === 0 ||
        v.name.toLowerCase().includes(query.toLowerCase());
      return hasPublicProfile && matchCategory && matchLocation && matchQuery;
    });
  }, [activeCategory, activeLocation, query, vendors]);

  // apply sorting after filtering
  const displayed = useMemo(() => {
    const arr = [...filtered];
    switch (sortOption) {
      case "rating-asc":
        arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case "rating-desc":
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "services-asc":
        arr.sort((a, b) => (a.services?.length || 0) - (b.services?.length || 0));
        break;
      case "services-desc":
        arr.sort((a, b) => (b.services?.length || 0) - (a.services?.length || 0));
        break;
    }
    return arr;
  }, [filtered, sortOption]);

  const userLocationHint = useMemo(() => {
    if (gpsLocationHint.trim()) return gpsLocationHint.trim();
    const fromUser =
      (currentUser as any)?.location ||
      (currentUser as any)?.address ||
      (currentUser as any)?.city ||
      "";
    if (typeof fromUser === "string" && fromUser.trim()) return fromUser.trim();
    if (typeof weddingAddress === "string" && weddingAddress.trim()) return weddingAddress.trim();
    return "";
  }, [gpsLocationHint, currentUser, weddingAddress]);

  const recommendedVendors = useMemo(() => {
    const canSuggest =
      query.trim().length === 0 &&
      activeCategory === "Tất cả" &&
      activeLocation === "Tất cả";
    if (!canSuggest) return [];
    const scored = displayed.map((v) => {
      const avg = averageServicePrice(v);
      const loc = locationScore(v.location || "", userLocationHint);
      const bud = budgetScore(avg, Number(weddingBudget || 0));
      const qual = qualityScore(v);
      const score = 0.45 * loc + 0.4 * bud + 0.15 * qual;
      return { vendor: v, score };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.vendor);
  }, [
    displayed,
    query,
    activeCategory,
    activeLocation,
    userLocationHint,
    weddingBudget,
  ]);

  const displayedList = useMemo(() => {
    if (recommendedVendors.length === 0) return displayed;
    const ids = new Set(recommendedVendors.map((v) => v.id));
    return displayed.filter((v) => !ids.has(v.id));
  }, [displayed, recommendedVendors]);

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={["top"]}>
      <StatusBar backgroundColor="#f7577c" barStyle="light-content" />
      <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Kết nối dịch vụ cưới
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerChatBtn}
          onPress={() => navigation.navigate("ChatList", { role: "user" })}
        >
          <MessageCircle size={18} color="#ffffff" />
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color="#9ca3af" />
        <TextInput
          placeholder="Tìm nhà cung cấp..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        style={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.filterSelect}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={styles.filterLabel} numberOfLines={1}>
            {activeCategory === "Tất cả" ? "Danh mục" : activeCategory}
          </Text>
          <ChevronDown size={18} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterSelect}
          onPress={() => setLocationModalVisible(true)}
        >
          <Text style={styles.filterLabel} numberOfLines={1}>
            {activeLocation === "Tất cả" ? "Địa điểm" : activeLocation}
          </Text>
          <ChevronDown size={18} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterSelect}
          onPress={() => setSortModalVisible(true)}
        >
          <Filter size={16} color="#9ca3af" style={{ marginRight: 4 }} />
          <Text style={styles.filterLabel} numberOfLines={1}>
            {sortOption === ""
              ? "Sắp xếp"
              : sortOption === "rating-asc"
                ? "Sao ↑"
                : sortOption === "rating-desc"
                  ? "Sao ↓"
                  : sortOption === "services-asc"
                    ? "Dịch vụ ↑"
                    : "Dịch vụ ↓"}
          </Text>
          <ChevronDown size={18} color="#9ca3af" />
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#f7577c" />
            <Text style={styles.loadingText}>Đang tải nhà cung cấp...</Text>
          </View>
        ) : displayed.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có nhà cung cấp.</Text>
        ) : (
          <>
            {recommendedVendors.length > 0 ? (
              <View style={styles.suggestWrap}>
                <Text style={styles.suggestTitle}>Gợi ý cho bạn</Text>
                <Text style={styles.suggestSubtitle}>
                  Ưu tiên theo vị trí gần bạn
                  {userLocationHint ? ` (${userLocationHint})` : ""}
                  {" "}và mức giá phù hợp ngân sách cưới.
                </Text>
                {recommendedVendors.map((v) => (
                  <TouchableOpacity
                    key={`suggest-${v.id}`}
                    style={[styles.card, styles.suggestCard]}
                    onPress={() =>
                      navigation.navigate("VendorDetail", { vendorId: v.id })
                    }
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardImageWrapper}>
                        {v.imageUrl ? (
                          <Image
                            source={{ uri: v.imageUrl }}
                            style={styles.cardImage}
                          />
                        ) : (
                          <View style={styles.cardImagePlaceholder}>
                            <Text style={styles.cardImageText}>
                              {(v.name || "?").slice(0, 1).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <View style={styles.cardHeaderLeft}>
                            <Text style={styles.cardTitle}>{v.name}</Text>
                          </View>
                          <View style={styles.ratingRow}>
                            <Star size={14} color="#f59e0b" />
                            <Text style={styles.ratingText}>{v.rating ?? 0}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardCategory}>{v.category}</Text>
                        <View style={styles.locationRow}>
                          <MapPin size={14} color="#9ca3af" />
                          <Text style={styles.locationText}>{v.location}</Text>
                        </View>
                        {Array.isArray(v.services) ? (
                          <Text style={styles.cardMeta}>
                            {v.services.length} dịch vụ đang cung cấp
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {displayedList.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("VendorDetail", { vendorId: v.id })
                }
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardImageWrapper}>
                    {v.imageUrl ? (
                      <Image
                        source={{ uri: v.imageUrl }}
                        style={styles.cardImage}
                      />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardImageText}>
                          {(v.name || "?").slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardTitle}>{v.name}</Text>
                      </View>
                      <View style={styles.ratingRow}>
                        <Star size={14} color="#f59e0b" />
                        <Text style={styles.ratingText}>
                          {v.rating ?? 0}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardCategory}>{v.category}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={14} color="#9ca3af" />
                      <Text style={styles.locationText}>{v.location}</Text>
                    </View>
                    {v.description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {v.description}
                      </Text>
                    ) : null}
                    {Array.isArray(v.services) ? (
                      <Text style={styles.cardMeta}>
                        {v.services.length} dịch vụ đang cung cấp
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      </View>

      <Modal visible={categoryModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSearchRow}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Tìm danh mục..."
              placeholderTextColor="#9ca3af"
              value={categoryQuery}
              onChangeText={setCategoryQuery}
            />
          </View>
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setActiveCategory(item);
                  setCategoryModalVisible(false);
                  setCategoryQuery("");
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmptyText}>
                Không tìm thấy danh mục.
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      <Modal visible={locationModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn địa điểm</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSearchRow}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Tìm địa điểm..."
              placeholderTextColor="#9ca3af"
              value={locationQuery}
              onChangeText={setLocationQuery}
            />
          </View>
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setActiveLocation(item);
                  setLocationModalVisible(false);
                  setLocationQuery("");
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmptyText}>
                Không tìm thấy địa điểm.
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* sort modal */}
      <Modal visible={sortModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sắp xếp</Text>
            <View style={{ width: 24 }} />
          </View>
          <FlatList
            data={
              [
                { label: "Mặc định", value: "" },
                { label: "Sao tăng dần", value: "rating-asc" },
                { label: "Sao giảm dần", value: "rating-desc" },
                { label: "Dịch vụ tăng dần", value: "services-asc" },
                { label: "Dịch vụ giảm dần", value: "services-desc" },
              ]
            }
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSortOption(item.value as any);
                  setSortModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmptyText}>Không có tùy chọn.</Text>
            }
          />
        </SafeAreaView>
      </Modal>
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
  listScroll: {
    flex: 1,
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
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  headerChatBtn: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerBadge: {
    position: "absolute",
    right: responsiveWidth(-4),
    top: responsiveWidth(-4),
    minWidth: responsiveWidth(16),
    height: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: responsiveWidth(4),
  },
  headerBadgeText: {
    fontSize: responsiveFont(9),
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#f7577c",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    borderRadius: responsiveWidth(22),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: responsiveWidth(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  filterRow: {
    paddingHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(12),
    height: responsiveHeight(48),
    flexGrow: 0, // ensure scrollview doesn't expand
  },
  filterSelect: {
    alignSelf: "flex-start",
    height: responsiveHeight(40),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#f8f9fa",
    paddingHorizontal: responsiveWidth(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(4),
    marginRight: responsiveWidth(6),
  },
  filterLabel: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(12),
    color: "#111827",
  },
  list: {
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(12),
  },
  suggestWrap: {
    backgroundColor: "#fff4f8",
    borderWidth: 1,
    borderColor: "#ffd6e3",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    marginBottom: responsiveHeight(10),
  },
  suggestTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#d81b60",
  },
  suggestSubtitle: {
    marginTop: responsiveHeight(4),
    marginBottom: responsiveHeight(10),
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(11),
    color: "#6b7280",
  },
  suggestCard: {
    marginBottom: responsiveHeight(8),
    borderColor: "#ffd6e3",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  modalTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    color: "#111827",
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    borderRadius: responsiveWidth(22),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: responsiveWidth(8),
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  modalList: {
    padding: responsiveWidth(16),
    gap: responsiveHeight(8),
  },
  modalItem: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(10),
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  modalItemText: {
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  modalEmptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
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
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardRow: {
    flexDirection: "row",
    gap: responsiveWidth(10),
  },
  cardImage: {
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#ffe4ea",
  },
  cardImagePlaceholder: {
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#ffe4ea",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(18),
    color: "#f7577c",
  },
  cardImageWrapper: {
    position: "relative",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
    flex: 1,
    marginRight: responsiveWidth(8),
  },
  cardTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(15),
    color: "#111827",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(4),
  },
  ratingText: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  cardCategory: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  cardDesc: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(12),
    color: "#4b5563",
  },
  cardMeta: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(11),
    color: "#9ca3af",
  },
  locationRow: {
    marginTop: responsiveHeight(6),
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
  },
  locationText: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
});
