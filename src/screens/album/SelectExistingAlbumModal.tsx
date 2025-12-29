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
} from "react-native";
import { X } from "lucide-react-native";
import * as userSelectionService from "../../service/userSelectionService";
import { Album } from "../../service/userSelectionService";
import { fonts } from "../../theme/fonts";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

interface SelectExistingAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAlbum: (album: Album) => void;
}

const SelectExistingAlbumModal: React.FC<SelectExistingAlbumModalProps> = ({
  visible,
  onClose,
  onSelectAlbum,
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAlbums();
    }
  }, [visible]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await userSelectionService.getUserAlbums();
      setAlbums(response.data || []);
    } catch (error) {
      console.error("Error fetching albums:", error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => {
        onSelectAlbum(item);
        onClose();
      }}
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
            <Text style={styles.placeholderText}>No Image</Text>
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
            <Text style={styles.modalTitle}>Chọn Album</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F9CBD6" />
              <Text style={styles.loadingText}>Đang tải albums...</Text>
            </View>
          ) : albums.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Bạn chưa có album nào. Hãy tạo album mới bằng cách chọn từng
                bước trong quy trình tạo album.
              </Text>
            </View>
          ) : (
            <FlatList
              data={albums}
              keyExtractor={(item) => item._id}
              renderItem={renderAlbumItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    backgroundColor: "#fff",
    borderTopLeftRadius: responsiveWidth(24),
    borderTopRightRadius: responsiveWidth(24),
    paddingTop: responsiveHeight(24),
    paddingBottom: responsiveHeight(40),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(24),
    marginBottom: responsiveHeight(16),
  },
  modalTitle: {
    fontSize: responsiveFont(20),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  closeButton: {
    padding: spacing.xs,
  },
  listContainer: {
    paddingHorizontal: responsiveWidth(24),
  },
  albumItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(16),
    backgroundColor: "#F9FAFB",
    borderRadius: borderRadius.md,
    marginBottom: responsiveHeight(12),
  },
  albumImageContainer: {
    width: responsiveWidth(60),
    height: responsiveWidth(60),
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginRight: responsiveWidth(16),
  },
  albumImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: responsiveFont(10),
    fontFamily: fonts.montserratMedium,
    color: "#9CA3AF",
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  albumDetails: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratRegular,
    color: "#6b7280",
  },
  loadingContainer: {
    paddingVertical: responsiveHeight(60),
    alignItems: "center",
  },
  loadingText: {
    marginTop: responsiveHeight(16),
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
  },
  emptyContainer: {
    paddingVertical: responsiveHeight(60),
    paddingHorizontal: responsiveWidth(32),
    alignItems: "center",
  },
  emptyText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: responsiveHeight(20),
  },
});

export default SelectExistingAlbumModal;
