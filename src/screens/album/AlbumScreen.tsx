import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Text,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AlbumCard from "../../components/AlbumCard";
import { useAlbumCreation } from "../../contexts/AlbumCreationContext";
import * as userSelectionService from "../../service/userSelectionService";
import * as albumService from "../../service/albumService";
import { Album } from "../../service/userSelectionService";
import { fonts } from "../../theme/fonts";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - responsiveWidth(16) * 2 - responsiveWidth(12)) / 2;

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "wedding-venue", label: "Địa điểm" },
  { value: "wedding-theme", label: "Phong cách" },
  { value: "wedding-dress", label: "Váy cưới" },
  { value: "vest", label: "Vest" },
  { value: "bride-engage", label: "Áo dài" },
  { value: "groom-engage", label: "Trang phục" },
  { value: "tone-color", label: "Tone màu" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

const AlbumScreen = () => {
  const navigation = useNavigation();
  const { startAlbumCreation } = useAlbumCreation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchAlbums();
      return () => {};
    }, [activeTab])
  );

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "my") {
        const response = await userSelectionService.getUserAlbums();
        setAlbums(response.data);
      } else {
        const response = await albumService.getAllAlbums(1, 50);
        setAlbums(response.data?.albums || response.albums || []);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải albums");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewAlbum = () => {
    // startAlbumCreation();
    // (navigation as any).navigate("Location");
    (navigation as any).navigate("TestCreateAlbum");
  };

  const handleAlbumPress = (album: Album) => {
    (navigation as any).navigate("AlbumDetail", { album, source: "my" });
  };

  const getFirstImage = (_album: Album): string => {
    return "";
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            (navigation as any).navigate("Main", { screen: "Home" })
          }
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            (navigation as any).navigate("Main", { screen: "Home" })
          }
        >
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải albums...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAlbums}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.albumGrid}>
            {albums.map((album) => (
              <View
                key={album._id}
                style={{
                  width: ITEM_WIDTH,
                  marginBottom: responsiveHeight(16),
                }}
              >
                <AlbumCard
                  id={album._id}
                  title={album.name}
                  authorName={(album as any).authorName}
                  imageUrl={(album as any).coverImage || getFirstImage(album)}
                  onPress={() => handleAlbumPress(album)}
                  cardWidth={ITEM_WIDTH}
                />
              </View>
            ))}
            {activeTab === "my" && (
              <View
                style={{
                  width: ITEM_WIDTH,
                  marginBottom: responsiveHeight(16),
                }}
              >
                <AlbumCard
                  id="add-new"
                  title="Thêm Album mới"
                  isAddNew
                  onPress={handleAddNewAlbum}
                  cardWidth={ITEM_WIDTH}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    height: responsiveHeight(64),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  logo: {
    height: responsiveHeight(32),
    width: responsiveWidth(48),
  },
  avatar: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
  },
  content: {
    flex: 1,
    paddingTop: responsiveHeight(16),
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(50),
  },
  loadingText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(50),
  },
  errorText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratMedium,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: responsiveHeight(16),
  },
  retryButton: {
    backgroundColor: "#F9CBD6",
    paddingVertical: spacing.md,
    paddingHorizontal: responsiveWidth(24),
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
});

export default AlbumScreen;
