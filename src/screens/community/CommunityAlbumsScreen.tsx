import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Heart,
  Bookmark,
  Eye,
  ChevronLeft,
  Plus,
  Image as ImageIcon,
} from "lucide-react-native";
import * as albumService from "../../service/albumService";
import AlbumCard from "../../components/AlbumCard";
import PublishAlbumModal from "./PublishAlbumModal";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

const COLORS = {
  primary: "#ff5a7a",
  primarySoft: "#ffe1e8",
  textDark: "#1f2937",
  textMuted: "#6b7280",
  bg: "#f8f9fa",
  white: "#ffffff",
};

export const CommunityAlbumsScreen = ({ navigation }: any) => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "mine" | "trending"
  >("all");
  const [showSelectModal, setShowSelectModal] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, [selectedFilter]);

  const loadAlbums = async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      let result;
      if (selectedFilter === "mine") {
        // Lấy albums công khai của user hiện tại (đã đăng lên cộng đồng)
        const myPublicAlbumsArray = await albumService.getMyPublicAlbums();
        setAlbums(myPublicAlbumsArray || []);
        setHasMore(false);
      } else {
        const response = await albumService.getAllAlbums(pageNum, 20);
        const newAlbums = response.albums || [];

        if (append) {
          setAlbums((prev) => [...prev, ...newAlbums]);
        } else {
          setAlbums(newAlbums);
        }

        // Check hasNextPage based on currentPage and totalPages
        setHasMore(response.currentPage < response.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error loading community albums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlbums(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore && selectedFilter === "all") {
      loadAlbums(page + 1, true);
    }
  };

  const handleAlbumPress = (albumId: string) => {
    navigation.navigate("AlbumDetail", { albumId, source: "community" });
  };

  const handleCreateAlbum = () => {
    // Mở modal để chọn album riêng tư đăng lên cộng đồng
    setShowSelectModal(true);
  };

  const handleAlbumPublished = () => {
    // Reload albums sau khi đăng thành công
    loadAlbums(1, false);
  };

  const handleFilterChange = (filter: "all" | "mine" | "trending") => {
    setSelectedFilter(filter);
    setPage(1);
    setHasMore(true);
  };

  const renderAlbum = ({ item }: any) => (
    <View style={styles.albumWrapper}>
      <AlbumCard
        id={item._id}
        title={item.name || "Album"}
        authorName={item.authorName || item.user?.fullName}
        imageUrl={item.coverImage || item.images?.[0]}
        onPress={() => handleAlbumPress(item._id)}
      />
      <View style={styles.albumStats}>
        <View style={styles.statItem}>
          <Heart size={16} color="#ff6b9d" fill="#ff6b9d" />
          <Text style={styles.statText}>{item.totalVotes || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Bookmark size={16} color="#ffc107" fill="#ffc107" />
          <Text style={styles.statText}>{item.totalSaves || 0}</Text>
        </View>
        {item.averageRating > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.ratingText}>
              ⭐ {item.averageRating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Header - Thread Style */}
        <View style={styles.mainHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Album ảnh cưới</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <Text style={styles.subtitle}>Khám phá ý tưởng từ các cặp đôi khác</Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("all")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "all" && styles.filterTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "mine" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("mine")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "mine" && styles.filterTextActive,
            ]}
          >
            Của tôi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || albums.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {isLoading && albums.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          key={`community-albums-${selectedFilter}`}
          data={albums}
          keyExtractor={(item) => item._id}
          renderItem={renderAlbum}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có album công khai</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateAlbum}>
        <Plus size={28} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>

      <PublishAlbumModal
        visible={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onPublished={handleAlbumPublished}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mainHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
    paddingBottom: responsiveHeight(12),
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    zIndex: 1,
  },
  headerSpacer: {
    width: responsiveWidth(24),
    zIndex: 1,
  },
  headerTitle: {
    fontFamily: "MavenPro-Bold",
    fontSize: responsiveFont(20),
    color: COLORS.white,
    position: "absolute",
    left: responsiveWidth(48),
    right: responsiveWidth(48),
    textAlign: "center",
  },
  logo: {
    fontFamily: "MavenPro-Bold",
    fontSize: responsiveFont(24),
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(12),
    gap: responsiveWidth(8),
  },
  title: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(22),
    color: "#1f2937",
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(4),
    paddingBottom: responsiveHeight(12),
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    gap: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: COLORS.textDark,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: responsiveHeight(3),
  },
  row: {
    justifyContent: "space-between",
    gap: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
  },
  albumWrapper: {
    flex: 1,
    marginBottom: responsiveHeight(2),
  },
  albumStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(1),
    gap: responsiveWidth(4),
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.textDark,
  },
  ratingText: {
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-SemiBold",
    color: "#ffc107",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: responsiveHeight(10),
    alignItems: "center",
  },
  emptyText: {
    fontSize: responsiveFont(16),
    color: COLORS.textMuted,
  },
  fab: {
    position: "absolute",
    right: responsiveWidth(20),
    bottom: responsiveHeight(64),
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    borderRadius: responsiveWidth(28),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CommunityAlbumsScreen;
