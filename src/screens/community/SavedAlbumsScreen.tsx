import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft, Bookmark, Heart } from "lucide-react-native";
import * as albumService from "../../service/albumService";
import AlbumCard from "../../components/AlbumCard";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

type SavedAlbumsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SavedAlbumsScreen"
>;

const SavedAlbumsScreen = () => {
  const navigation = useNavigation<SavedAlbumsScreenNavigationProp>();

  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedAlbums();
  }, []);

  const loadSavedAlbums = async () => {
    setIsLoading(true);
    try {
      const response = await albumService.getSavedAlbums();
      setSavedAlbums(response || []);
    } catch (error) {
      console.error("Error loading saved albums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedAlbums();
    setRefreshing(false);
  };

  const handleAlbumPress = (albumId: string) => {
    navigation.navigate("AlbumDetail", { albumId, source: "community" });
  };

  const renderAlbum = ({ item }: any) => {
    const album = item.albumId; // savedAlbum.albumId chứa thông tin album đã populate
    if (!album || !album._id) return null;

    return (
      <View style={styles.albumWrapper}>
        <AlbumCard
          id={album._id}
          title={album.name || "Album"}
          imageUrl={album.images?.[0] || album.coverImage}
          onPress={() => handleAlbumPress(album._id)}
        />
        <View style={styles.albumStats}>
          <View style={styles.statItem}>
            <Heart size={14} color="#ff6b9d" />
            <Text style={styles.statText}>{album.totalVotes || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Bookmark size={14} color="#ffc107" />
            <Text style={styles.statText}>{album.totalSaves || 0}</Text>
          </View>
          {album.averageRating > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.ratingText}>
                ⭐ {album.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Album đã lưu</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Albums List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffc107" />
        </View>
      ) : (
        <FlatList
          data={savedAlbums}
          renderItem={renderAlbum}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#ffc107"]}
              tintColor="#ffc107"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bookmark size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Chưa có album đã lưu</Text>
              <Text style={styles.emptyText}>
                Lưu những album yêu thích để xem lại sau
              </Text>
            </View>
          }
        />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  listContent: {
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(16),
    paddingBottom: responsiveHeight(16),
  },
  row: {
    justifyContent: "space-between",
    marginBottom: responsiveHeight(16),
  },
  albumWrapper: {
    flex: 1,
    maxWidth: "48%",
  },
  albumStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
    marginTop: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(4),
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(4),
  },
  statText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  ratingText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#ffc107",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(100),
    paddingHorizontal: responsiveWidth(32),
  },
  emptyTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(8),
  },
  emptyText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    textAlign: "center",
  },
});

export default SavedAlbumsScreen;
