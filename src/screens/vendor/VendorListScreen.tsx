import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from "react-native";
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

export default function VendorListScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentUser = useSelector(selectCurrentUser);
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

  const isFeatured = (vendor: Vendor) => vendor.isFeatured === true;

  // apply sorting after filtering
  const displayed = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (isFeatured(a) === isFeatured(b)) return 0;
      return isFeatured(a) ? -1 : 1;
    });
    switch (sortOption) {
      case "rating-asc":
        arr.sort((a, b) => {
          if (isFeatured(a) !== isFeatured(b)) return isFeatured(a) ? -1 : 1;
          return (a.rating || 0) - (b.rating || 0);
        });
        break;
      case "rating-desc":
        arr.sort((a, b) => {
          if (isFeatured(a) !== isFeatured(b)) return isFeatured(a) ? -1 : 1;
          return (b.rating || 0) - (a.rating || 0);
        });
        break;
      case "services-asc":
        arr.sort((a, b) => {
          if (isFeatured(a) !== isFeatured(b)) return isFeatured(a) ? -1 : 1;
          return (a.services?.length || 0) - (b.services?.length || 0);
        });
        break;
      case "services-desc":
        arr.sort((a, b) => {
          if (isFeatured(a) !== isFeatured(b)) return isFeatured(a) ? -1 : 1;
          return (b.services?.length || 0) - (a.services?.length || 0);
        });
        break;
    }
    return arr;
  }, [filtered, sortOption]);

  return (
    <SafeAreaView style={styles.safeArea}>
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

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải nhà cung cấp...</Text>
          </View>
        ) : displayed.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có nhà cung cấp.</Text>
        ) : (
          displayed.map((v) => (
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
                      {isFeatured(v) && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>
                            Đề xuất
                          </Text>
                        </View>
                      )}
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
          ))
        )}
      </ScrollView>

      <Modal visible={categoryModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
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
        <SafeAreaView style={styles.modalSafeArea}>
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
        <SafeAreaView style={styles.modalSafeArea}>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    height: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
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
    fontFamily: "Montserrat-SemiBold",
    color: "#ff5a7a",
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
    fontFamily: "Montserrat-Medium",
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
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#111827",
  },
  list: {
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(12),
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
    fontFamily: "MavenPro",
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
    fontFamily: "Montserrat-Medium",
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
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#ff5a7a",
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
    fontFamily: "Montserrat-SemiBold",
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
  recommendedBadge: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(2),
    borderRadius: responsiveWidth(999),
  },
  recommendedBadgeText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(10),
    color: "#be123c",
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
