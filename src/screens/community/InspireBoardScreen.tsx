import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, ChevronLeft, Search } from "lucide-react-native";
import * as postService from "../../service/postService";
import * as albumService from "../../service/albumService";
import { PostCard } from "../../components/PostCard";
import AlbumCard from "../../components/AlbumCard";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

export const InspireBoardScreen = ({ navigation }: any) => {
  const [selectedTab, setSelectedTab] = useState<"posts" | "albums">("posts");
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingAlbums, setTrendingAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    loadInspireData();
  }, [selectedTab]);

  const loadInspireData = async () => {
    setIsLoading(true);
    try {
      if (selectedTab === "posts") {
        // Chỉ lấy trending posts (bài viết trong vòng 7 ngày gần đây)
        const trending = await postService.getTrendingPosts(20, 7);
        setTrendingPosts(trending);
      } else {
        // Chỉ lấy trending albums (albums trong vòng 7 ngày gần đây)
        const trending = await albumService.getTrendingAlbums(20, 7);
        setTrendingAlbums(trending);
      }
    } catch (error) {
      console.error("Error loading inspire data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleAlbumPress = (albumId: string) => {
    navigation.navigate("AlbumDetail", { albumId });
  };

  const renderPost = ({ item }: any) => (
    <PostCard
      post={item}
      currentUserId={currentUserId}
      onPress={() => handlePostPress(item._id)}
      onReact={(type) => console.log("React", type)}
      onUnreact={() => console.log("Unreact")}
    />
  );

  const renderAlbum = ({ item }: any) => (
    <AlbumCard
      id={item._id}
      title={item.name || "Album"}
      imageUrl={item.coverImage}
      onPress={() => handleAlbumPress(item._id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Thread Style */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.logo}>Cảm hứng</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <Text style={styles.subtitle}>
        Những ý tưởng được yêu thích nhất trong tuần
      </Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "posts" && styles.activeTab]}
          onPress={() => setSelectedTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "posts" && styles.activeTabText,
            ]}
          >
            Bài viết
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "albums" && styles.activeTab]}
          onPress={() => setSelectedTab("albums")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "albums" && styles.activeTabText,
            ]}
          >
            Album
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffc107" />
        </View>
      ) : (
        <>
          {selectedTab === "posts" ? (
            <FlatList
              key="inspire-posts-list"
              data={trendingPosts}
              keyExtractor={(item) => item._id}
              renderItem={renderPost}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Chưa có bài viết nổi bật trong tuần này
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              key="inspire-albums-grid"
              data={trendingAlbums}
              keyExtractor={(item) => item._id}
              renderItem={renderAlbum}
              contentContainerStyle={styles.listContent}
              numColumns={2}
              columnWrapperStyle={styles.albumRow}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Chưa có album nổi bật trong tuần này
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
    paddingBottom: responsiveHeight(12),
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(24),
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(8),
    marginBottom: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: responsiveWidth(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
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
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(4),
    paddingBottom: responsiveHeight(12),
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    gap: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: "#ffc107",
    borderColor: "#ffc107",
  },
  tabText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  activeTabText: {
    color: "#ffffff",
  },
  sectionHeader: {
    paddingVertical: responsiveHeight(1.5),
  },
  sectionTitle: {
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#1a1a1a",
  },
  listContent: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(2),
  },
  albumRow: {
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: responsiveHeight(10),
    alignItems: "center",
  },
  emptyText: {
    fontSize: responsiveFont(16),
    color: "#999",
  },
});
