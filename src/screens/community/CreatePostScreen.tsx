import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft, ImagePlus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { AppDispatch, RootState } from "../../store";
import {
  createNewPost,
  updateExistingPost,
  fetchPostById,
} from "../../store/postSlice";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { MixpanelService } from "../../service/mixpanelService";
import apiClient from "../../api/client";
import { selectCurrentUser } from "../../store/authSlice";
import {
  canAddImageToPost,
  getMaxImagesPerPost,
  getUpgradeMessage,
} from "../../utils/accountLimits";

type CreatePostScreenRouteProp = RouteProp<
  RootStackParamList,
  "CreatePostScreen"
>;
type CreatePostScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CreatePostScreen"
>;

const CreatePostScreen = () => {
  const route = useRoute<CreatePostScreenRouteProp>();
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const postId = route.params?.postId;
  const isEditing = !!postId;

  const { currentPost, isLoading } = useSelector(
    (state: RootState) => state.posts
  );
  const currentUser = useSelector(selectCurrentUser);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const maxImagesPerPost = getMaxImagesPerPost(
    currentUser?.accountType || "FREE"
  );
  const canAddMoreImages =
    maxImagesPerPost === null
      ? true
      : images.length < maxImagesPerPost;

  useEffect(() => {
    if (isEditing) {
      MixpanelService.track("Started Editing Post", { postId });
      dispatch(fetchPostById(postId));
    } else {
      MixpanelService.track("Started Creating Post");
    }
  }, [isEditing, postId, dispatch]);

  useEffect(() => {
    if (isEditing && currentPost) {
      setContent(currentPost.content);
      setImages(currentPost.images || []);
    }
  }, [isEditing, currentPost]);

  // Hàm chọn ảnh từ thiết bị
  const handlePickImages = async () => {
    try {
      // Lấy thông tin user
      const state = require("../../store").store.getState();
      const user = selectCurrentUser(state);
      const accountType = user?.accountType || "FREE";

      // Kiểm tra giới hạn ảnh
      const maxImages = getMaxImagesPerPost(accountType);
      if (!canAddImageToPost(images.length, accountType)) {
        Alert.alert("Nâng cấp tài khoản", getUpgradeMessage("postImage"), [
          { text: "Hủy", style: "cancel" },
          {
            text: "Nâng cấp",
            onPress: () => (navigation as any).navigate("UpgradeAccountScreen"),
          },
        ]);
        return;
      }

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh."
        );
        return;
      }

      const remainingSlots =
        maxImages != null
          ? maxImages - images.length
          : Math.max(1, 30 - images.length);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots > 0 ? remainingSlots : 1,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingImages(true);

        // Upload từng ảnh lên Cloudinary
        const formData = new FormData();

        result.assets.forEach((asset, index) => {
          const filename = asset.uri.split("/").pop() || `image-${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";

          formData.append("images", {
            uri: asset.uri,
            name: filename,
            type: type,
          } as any);
        });

        const response = await apiClient.post("/upload/post-images", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const cloudinaryUrls = response.data.imageUrls;
        setImages([...images, ...cloudinaryUrls]);

        Alert.alert("Thành công", `Đã thêm ${cloudinaryUrls.length} ảnh`);
      }
    } catch (error: any) {
      console.error("Lỗi upload ảnh:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImages(false);
    }
  };

  // Hàm xóa ảnh
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung bài viết");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await dispatch(
          updateExistingPost({
            postId: postId!,
            data: { content, images },
          })
        ).unwrap();
        MixpanelService.track("Updated Post", { postId });
        Alert.alert("Thành công", "Đã cập nhật bài viết", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await dispatch(createNewPost({ content, images })).unwrap();
        MixpanelService.track("Created Post");
        Alert.alert("Thành công", "Đã tạo bài viết mới", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo/cập nhật bài viết:", error); // <-- Dòng quan trọng để xem lỗi trong log
      const errorMessage =
        error?.message ||
        (error?.success === false ? error.message : "Có lỗi xảy ra (Không rõ)");

      Alert.alert("Đăng bài thất bại", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || images.length > 0) {
      Alert.alert(
        "Hủy bỏ",
        "Bạn có chắc muốn hủy? Nội dung chưa lưu sẽ bị mất.",
        [
          { text: "Tiếp tục viết", style: "cancel" },
          {
            text: "Hủy bỏ",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (isEditing && isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b9d" />
        <Text style={styles.loadingText}>Đang tải bài viết...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !content.trim()}
        >
          <Text
            style={[
              styles.saveButton,
              (isSaving || !content.trim()) && styles.saveButtonDisabled,
            ]}
          >
            {isSaving ? "Đang lưu..." : "Đăng"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(100)
                : responsiveHeight(60),
          }}
        >
          {/* Content Input */}
          <TextInput
            style={styles.contentInput}
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          {/* Image Picker */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thêm ảnh</Text>
              {canAddMoreImages && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handlePickImages}
                  disabled={uploadingImages}
                >
                  <ImagePlus size={20} color="#ff6b9d" />
                  <Text style={styles.addImageText}>
                    {uploadingImages ? "Đang tải..." : "Chọn ảnh"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Hiển thị danh sách ảnh đã chọn */}
            {images.length > 0 && (
              <ScrollView horizontal style={styles.imagePreviewContainer}>
                {images.map((imageUrl, index) => (
                  <View key={index} style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <X size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={styles.sectionSubtitle}>
              {maxImagesPerPost === null
                ? `Không giới hạn số ảnh • ${images.length} ảnh đã chọn`
                : `Tối đa ${maxImagesPerPost} ảnh • ${images.length}/${maxImagesPerPost}`}
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Mẹo viết bài:</Text>
            <Text style={styles.tipText}>
              • Chia sẻ khoảnh khắc đẹp của đám cưới
            </Text>
            <Text style={styles.tipText}>• Chia sẻ kinh nghiệm, mẹo hay</Text>
            <Text style={styles.tipText}>
              • Tôn trọng cộng đồng, tránh nội dung không phù hợp
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    marginTop: responsiveHeight(12),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    height: responsiveHeight(64),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
    marginHorizontal: responsiveWidth(8),
  },
  saveButton: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(16),
    color: "#ff6b9d",
  },
  saveButtonDisabled: {
    color: "#9ca3af",
  },
  content: {
    flex: 1,
    padding: responsiveWidth(16),
  },
  contentInput: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    minHeight: responsiveHeight(200),
    textAlignVertical: "top",
  },
  section: {
    marginTop: responsiveHeight(24),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(12),
  },
  sectionTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(8),
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff1f5",
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(8),
    borderRadius: responsiveWidth(8),
    gap: responsiveWidth(6),
  },
  addImageText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(13),
    color: "#ff6b9d",
  },
  imagePreviewContainer: {
    marginVertical: responsiveHeight(12),
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: responsiveWidth(12),
  },
  imagePreview: {
    width: responsiveWidth(100),
    height: responsiveWidth(100),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#f3f4f6",
  },
  removeImageButton: {
    position: "absolute",
    top: responsiveHeight(6),
    right: responsiveWidth(6),
    backgroundColor: "#ef4444",
    borderRadius: responsiveWidth(12),
    width: responsiveWidth(24),
    height: responsiveWidth(24),
    justifyContent: "center",
    alignItems: "center",
  },
  imageInput: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(12),
    minHeight: responsiveHeight(100),
    backgroundColor: "#f9fafb",
  },
  tipsContainer: {
    marginTop: responsiveHeight(24),
    backgroundColor: "#fef3c7",
    padding: responsiveWidth(16),
    borderRadius: responsiveWidth(12),
  },
  tipsTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#92400e",
    marginBottom: responsiveHeight(8),
  },
  tipText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(12),
    color: "#92400e",
    marginBottom: responsiveHeight(4),
  },
});

export default CreatePostScreen;
