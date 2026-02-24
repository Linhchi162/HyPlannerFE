import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import * as albumService from "../../service/albumService";
import { Album } from "../../service/albumService";
import { fonts } from "../../theme/fonts";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PublishAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
}

const PublishAlbumModal: React.FC<PublishAlbumModalProps> = ({
  visible,
  onClose,
  onPublished,
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPrivateAlbums();
    }
  }, [visible]);

  const fetchPrivateAlbums = async () => {
    setLoading(true);
    try {
      const allAlbums = await albumService.getMyAlbums();
      // Chỉ lấy albums private (chưa đăng)
      const privateAlbums = allAlbums.filter((album) => !album.isPublic);
      setAlbums(privateAlbums);
    } catch (error) {
      console.error("Error fetching private albums:", error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAlbum = async (album: Album) => {
    // Publish album directly without showing metadata modal
    Alert.alert(
      "Đăng album lên cộng đồng",
      `Bạn có chắc muốn đăng album "${album.name}" lên cộng đồng?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng",
          onPress: async () => {
            setPublishing(true);
            try {
              await albumService.publishAlbum(album._id, true);
              Alert.alert("Thành công", "Đã đăng album lên cộng đồng");
              onPublished();
              onClose();
            } catch (error: any) {
              console.error("Error publishing album:", error);
              Alert.alert(
                "Lỗi",
                error.message || "Không thể đăng album lên cộng đồng"
              );
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => handlePublishAlbum(item)}
      disabled={publishing}
    >
      <View style={styles.albumImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.albumImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.albumInfo}>
        <Text style={styles.albumName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.albumDetails}>
          {item.selections?.length || 0} selections
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đăng album lên cộng đồng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b9d" />
              </View>
            ) : albums.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Không có album riêng tư nào để đăng
                </Text>
                <Text style={styles.emptySubtext}>
                  Tạo album mới trong tab Album của bạn
                </Text>
              </View>
            ) : (
              <FlatList
                data={albums}
                renderItem={renderAlbumItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: SCREEN_HEIGHT * 0.7,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: responsiveFont(18),
    fontFamily: "Roboto",
    color: "#111827",
  },
  closeButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: responsiveFont(16),
    fontFamily: "Roboto",
    color: "#6b7280",
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: responsiveFont(14),
    fontFamily: "Roboto",
    color: "#9ca3af",
    textAlign: "center",
  },
  listContent: {
    padding: spacing.lg,
  },
  albumItem: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  albumImageContainer: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginRight: spacing.md,
  },
  albumImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: responsiveFont(24),
  },
  albumInfo: {
    flex: 1,
    justifyContent: "center",
  },
  albumName: {
    fontSize: responsiveFont(16),
    fontFamily: "Roboto",
    color: "#111827",
    marginBottom: spacing.xs,
  },
  albumDetails: {
    fontSize: responsiveFont(14),
    fontFamily: "Roboto",
    color: "#6b7280",
  },
});

export default PublishAlbumModal;
