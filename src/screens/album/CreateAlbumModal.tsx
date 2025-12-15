import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { X, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as userSelectionService from "../../service/userSelectionService";
import { fonts } from "../../theme/fonts";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (name: string, authorName?: string, coverImage?: string) => void;
  initialName?: string;
  initialAuthorName?: string;
  initialCoverImage?: string;
  isEdit?: boolean;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  visible,
  onClose,
  onCreated,
  initialName = "",
  initialAuthorName = "",
  initialCoverImage = "",
  isEdit = false,
}) => {
  const [albumName, setAlbumName] = useState(initialName);
  const [authorName, setAuthorName] = useState(initialAuthorName);
  const [coverImage, setCoverImage] = useState<string>(initialCoverImage);
  const [coverImageFile, setCoverImageFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setAlbumName(initialName);
      setAuthorName(initialAuthorName);
      setCoverImage(initialCoverImage);
      setCoverImageFile(null);
    }
  }, [visible, initialName, initialAuthorName, initialCoverImage]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCoverImage(asset.uri);
        setCoverImageFile({
          uri: asset.uri,
          type: "image/jpeg",
          name: `cover-${Date.now()}.jpg`,
        });
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể chọn ảnh");
    }
  };

  const handleCreate = async () => {
    if (!albumName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên album");
      return;
    }

    setIsCreating(true);
    try {
      let uploadedCoverImage = coverImage; // Giữ lại ảnh cũ nếu là edit mode

      // Upload cover image mới nếu có
      if (coverImageFile) {
        const uploadResponse = await userSelectionService.uploadAlbumImages([
          coverImageFile,
        ]);
        uploadedCoverImage = uploadResponse.imageUrls[0] || "";
      }

      if (isEdit) {
        // Nếu là edit mode, chỉ trả về data để parent component xử lý
        onCreated(albumName, authorName, uploadedCoverImage);
        onClose();
      } else {
        // Nếu là create mode, tạo album mới
        await userSelectionService.createAlbum(
          albumName,
          authorName,
          uploadedCoverImage
        );

        Alert.alert("Thành công", "Đã tạo album mới", [
          {
            text: "OK",
            onPress: () => {
              setAlbumName("");
              setAuthorName("");
              setCoverImage("");
              setCoverImageFile(null);
              onCreated(albumName, authorName, uploadedCoverImage);
              onClose();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error creating album:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo album");
    } finally {
      setIsCreating(false);
    }
  };

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
            <Text style={styles.modalTitle}>Tạo Album mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Cover Image */}
            <View style={styles.section}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickImage}
              >
                {coverImage ? (
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.coverImagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Camera size={32} color="#9ca3af" />
                    <Text style={styles.imagePickerText}>Chọn ảnh</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Album Name */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Tên Album <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Album cưới của tôi"
                placeholderTextColor="#9ca3af"
                value={albumName}
                onChangeText={setAlbumName}
                maxLength={50}
              />
            </View>

            {/* Author Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Bút danh</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Couple A & B"
                placeholderTextColor="#9ca3af"
                value={authorName}
                onChangeText={setAuthorName}
                maxLength={50}
              />
              <Text style={styles.hint}>
                Tên này sẽ hiển thị công khai khi bạn chia sẻ album
              </Text>
            </View>

            {/* Create/Update Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (!albumName.trim() || isCreating) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!albumName.trim() || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>
                  {isEdit ? "Cập nhật & Đăng" : "Tạo Album"}
                </Text>
              )}
            </TouchableOpacity>
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
    height: SCREEN_HEIGHT * 0.75,
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
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: responsiveFont(18),
    fontFamily: fonts.montserratSemiBold,
    color: "#111827",
  },
  closeButton: {
    padding: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    color: "#374151",
    marginBottom: spacing.sm,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  hint: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginTop: spacing.xs,
  },
  imagePickerButton: {
    width: "100%",
    height: responsiveHeight(150),
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e5e7eb",
  },
  coverImagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  imagePickerText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginTop: spacing.sm,
  },
  createButton: {
    backgroundColor: "#9333ea",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  createButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  createButtonText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#ffffff",
  },
});

export default CreateAlbumModal;
