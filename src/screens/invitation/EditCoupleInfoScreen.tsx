// screens/EditCoupleInfo.tsx

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
// 1. IMPORT PICKER
import { Picker } from "@react-native-picker/picker";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit,
  ImagePlus,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  RootStackParamList,
  LoveStoryItem,
  WeddingEvent,
} from "../../navigation/types";
// API client for invitation service
import invitationClient from "../../api/invitationClient";
// general API client (used for uploads)
import apiClient from "../../api/client";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";
import logger from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// shared color palette used across most screens
const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#374151",
  textSecondary: "#6D6D6D",
  primary: "#ff5a7a",      // main brand pink
  accent: "#e07181",       // secondary/action color
  white: "#FFFFFF",
  error: "#e74c3c",
};

type EditCoupleInfoRouteProp = RouteProp<RootStackParamList, "EditCoupleInfo">;

// 2. THÊM DANH SÁCH NGÂN HÀNG
const VIETQR_BANKS = [
  { name: "Chọn ngân hàng...", bin: "" },
  { name: "MB Bank", bin: "970422" },
  { name: "Vietcombank", bin: "970436" },
  { name: "Techcombank", bin: "970407" },
  { name: "Vietinbank", bin: "970415" },
  { name: "BIDV", bin: "970418" },
  { name: "Agribank", bin: "970405" },
  { name: "VPBank", bin: "970432" },
  { name: "ACB", bin: "970416" },
  { name: "Sacombank", bin: "970403" },
  { name: "TPBank", bin: "970423" },
];

export default function EditCoupleInfo() {
  const navigation = useNavigation();
  const route = useRoute<EditCoupleInfoRouteProp>();
  const { invitation, sectionType, title } = route.params;
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Hàm upload ảnh lên Cloudinary
  const handlePickImage = async (fieldName: string) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        const imageUri = result.assets[0].uri;
        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("images", {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);

        const response = await apiClient.post("/upload/post-images", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const cloudinaryUrl = response.data.imageUrls[0];
        logger.log("Cloudinary URL:", cloudinaryUrl);
        setCurrentItem({ ...currentItem, [fieldName]: cloudinaryUrl });
        logger.log("Updated currentItem:", {
          ...currentItem,
          [fieldName]: cloudinaryUrl,
        });

        Alert.alert("Thành công", "Đã tải ảnh lên!");
      }
    } catch (error: any) {
      logger.error("Lỗi upload ảnh:", error);
      logger.error("Error response:", error.response?.data);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    switch (sectionType) {
      case "coupleInfo":
        setData({
          groomName: invitation.groomName || "",
          brideName: invitation.brideName || "",
          aboutCouple: invitation.aboutCouple || "",
        });
        break;
      case "album":
        setData(invitation.album || []);
        break;
      case "loveStory":
        setData(
          (invitation.loveStory || []).map((item) => ({
            ...item,
            _id: Math.random().toString(),
          }))
        );
        break;
      case "events":
        setData(
          (invitation.events || []).map((item) => ({
            ...item,
            _id: Math.random().toString(),
          }))
        );
        break;
      case "youtubeVideo":
        setData(invitation.youtubeUrl || "");
        break;

      // 3. THÊM CASE MỚI CHO BANK ACCOUNT
      case "bankAccount":
        setData({
          bankBin: invitation.bankAccount?.bankBin || "",
          accountNumber: invitation.bankAccount?.accountNumber || "",
        });
        break;
    }
  }, [invitation, sectionType]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    let payload = {};

    switch (sectionType) {
      case "coupleInfo":
        payload = data;
        break;
      case "album":
        logger.log("Saving album data:", data);
        payload = { album: data };
        break;
      case "loveStory":
      case "events":
        const cleanData = data.map(({ _id, ...rest }: any) => rest);
        payload = { [sectionType]: cleanData };
        break;
      case "youtubeVideo":
        payload = { youtubeUrl: data };
        break;

      // 4. THÊM CASE MỚI CHO BANK ACCOUNT
      case "bankAccount":
        payload = { bankAccount: data };
        break;
    }

    logger.log("Payload to send:", JSON.stringify(payload, null, 2));

    try {
      const response = await invitationClient.put(
        "/invitation/my-invitation",
        payload
      );
      logger.log("Update response:", response.data);
      dispatch(fetchUserInvitation());
      Alert.alert("Thành công", `Đã cập nhật mục "${title}"!`);
      navigation.goBack();
    } catch (error: any) {
      logger.error("Error updating invitation:", error);
      logger.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể lưu thay đổi.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Hàm openModalToAdd giữ nguyên)
  const openModalToAdd = () => {
    setIsEditing(false);
    let emptyItem = {};
    if (sectionType === "loveStory") {
      emptyItem = { title: "", time: "", content: "", image: "" };
    } else if (sectionType === "events") {
      emptyItem = {
        name: "",
        time: "",
        venue: "",
        address: "",
        mapLink: "",
        image: "",
      };
    } else if (sectionType === "album") {
      emptyItem = { url: "" };
    }
    setCurrentItem(emptyItem);
    setModalVisible(true);
  };

  // ... (Hàm openModalToEdit giữ nguyên)
  const openModalToEdit = (item: any, index?: number) => {
    setIsEditing(true);
    if (sectionType === "album") {
      setCurrentItem({ url: item, index: index });
    } else {
      setCurrentItem(item);
    }
    setModalVisible(true);
  };

  // ... (Hàm handleDeleteItem giữ nguyên)
  const handleDeleteItem = (identifier: string | number) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa mục này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          if (sectionType === "album") {
            setData((currentData: string[]) =>
              currentData.filter((_, index) => index !== identifier)
            );
          } else {
            setData((currentData: any[]) =>
              currentData.filter((item) => item._id !== identifier)
            );
          }
        },
      },
    ]);
  };

  // ... (Hàm handleSaveItemInModal giữ nguyên)
  const handleSaveItemInModal = () => {
    logger.log("handleSaveItemInModal - sectionType:", sectionType);
    logger.log("handleSaveItemInModal - currentItem:", currentItem);
    logger.log("handleSaveItemInModal - isEditing:", isEditing);

    if (sectionType === "album") {
      // Sửa validation để chấp nhận URL từ Cloudinary
      if (
        !currentItem.url ||
        (typeof currentItem.url === "string" && !currentItem.url.trim())
      ) {
        Alert.alert("Lỗi", "Vui lòng chọn ảnh trước khi lưu.");
        return;
      }
      if (isEditing) {
        const newAlbum = [...(data as string[])];
        newAlbum[currentItem.index] = currentItem.url;
        logger.log("Updated album (editing):", newAlbum);
        setData(newAlbum);
      } else {
        const newAlbum = [...(data as string[]), currentItem.url];
        logger.log("Updated album (adding):", newAlbum);
        setData(newAlbum);
      }
    } else {
      const isTitleMissing = !currentItem.title && !currentItem.name;
      if (
        isTitleMissing ||
        currentItem.title?.trim() === "" ||
        currentItem.name?.trim() === ""
      ) {
        Alert.alert("Lỗi", "Tên hoặc tiêu đề không được để trống.");
        return;
      }
      if (isEditing) {
        setData(
          data.map((item: any) =>
            item._id === currentItem._id ? currentItem : item
          )
        );
      } else {
        setData([...data, { ...currentItem, _id: Math.random().toString() }]);
      }
    }
    setModalVisible(false);
  };

  const renderContent = () => {
    if (data === null) return <ActivityIndicator style={{ marginTop: 50 }} />;

    switch (sectionType) {
      case "coupleInfo":
        return (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.label}>Tên chú rể</Text>
            <TextInput
              style={styles.input}
              value={data.groomName}
              onChangeText={(text) => setData({ ...data, groomName: text })}
            />
            <Text style={styles.label}>Tên cô dâu</Text>
            <TextInput
              style={styles.input}
              value={data.brideName}
              onChangeText={(text) => setData({ ...data, brideName: text })}
            />
            <Text style={styles.label}>Giới thiệu về cặp đôi</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: "top" }]}
              multiline
              value={data.aboutCouple}
              onChangeText={(text) => setData({ ...data, aboutCouple: text })}
            />
          </ScrollView>
        );

      case "album":
        return (
          <FlatList
            data={data as string[]}
            keyExtractor={(_, index) => index.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có ảnh nào trong album.</Text>
            }
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item, index }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText} numberOfLines={1}>
                  {item}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => openModalToEdit(item, index)}
                    style={{ marginHorizontal: 15 }}
                  >
                    <Edit size={20} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(index)}>
                    <Trash2 size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );

      case "loveStory":
        return (
          <FlatList
            data={data as LoveStoryItem[]}
            keyExtractor={(item) => item._id!}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có câu chuyện nào.</Text>
            }
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text>{item.time}</Text>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => openModalToEdit(item)}
                    style={{ marginHorizontal: 15 }}
                  >
                    <Edit size={20} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item._id!)}>
                    <Trash2 size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );

      case "events":
        return (
          <FlatList
            data={data as WeddingEvent[]}
            keyExtractor={(item) => item._id!}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có sự kiện nào.</Text>
            }
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text>
                    {item.time} - {item.venue}
                  </Text>
                  {item.embedMapUrl && (
                    <Text style={{ fontSize: 12, color: "gray" }}>
                      Có bản đồ nhúng
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => openModalToEdit(item)}
                    style={{ marginHorizontal: 15 }}
                  >
                    <Edit size={20} color="#3498db" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item._id!)}>
                    <Trash2 size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        );
      case "youtubeVideo":
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Link YouTube Video</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.youtube.com/watch?v=..."
              value={data}
              onChangeText={setData}
            />
            <Text style={styles.hintText}>
              Dán link video YouTube của bạn vào đây. Website sẽ tự động nhúng
              video vào trang.
            </Text>
          </View>
        );

      // 5. THÊM CASE MỚI ĐỂ RENDER FORM BANK
      case "bankAccount":
        return (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.label}>Ngân hàng thụ hưởng</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={data.bankBin}
                onValueChange={(itemValue) =>
                  setData({ ...data, bankBin: itemValue })
                }
                style={styles.picker}
              >
                {VIETQR_BANKS.map((bank) => (
                  <Picker.Item
                    key={bank.bin}
                    label={bank.name}
                    value={bank.bin}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Số tài khoản</Text>
            <TextInput
              style={styles.input}
              value={data.accountNumber}
              onChangeText={(text) =>
                setData({ ...data, accountNumber: text.trim() })
              }
              placeholder="Nhập số tài khoản"
              keyboardType="numeric"
            />
            <Text style={styles.hintText}>
              Mã QR VietQR sẽ được tạo tự động trên website của bạn.
            </Text>
          </ScrollView>
        );

      default:
        return <Text>Không tìm thấy mục chỉnh sửa.</Text>;
    }
  };

  const renderModal = () => {
    // ... (phần renderModal không thay đổi)
    if (sectionType === "album") {
      return (
        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Chỉnh sửa" : "Thêm mới"} Ảnh
              </Text>

              {/* Preview ảnh */}
              {currentItem.url && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: currentItem.url }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Nút chọn ảnh */}
              <TouchableOpacity
                style={styles.pickImageButton}
                onPress={() => handlePickImage("url")}
                disabled={uploadingImage}
              >
                <ImagePlus size={20} color="#ff6b9d" />
                <Text style={styles.pickImageText}>
                  {uploadingImage
                    ? "Đang tải..."
                    : currentItem.url
                      ? "Thay đổi ảnh"
                      : "Chọn ảnh từ thiết bị"}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSaveItemInModal}
                  disabled={uploadingImage}
                >
                  <Text style={{ color: "#fff" }}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }
    if (sectionType === "loveStory") {
      return (
        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Chỉnh sửa" : "Thêm mới"} Câu chuyện
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Tiêu đề (vd: Lần đầu gặp gỡ)"
                value={currentItem.title}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, title: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Thời gian (vd: Mùa hè 2020)"
                value={currentItem.time}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, time: text })
                }
              />
              <TextInput
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                multiline
                placeholder="Nội dung câu chuyện"
                value={currentItem.content}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, content: text })
                }
              />

              {/* Preview ảnh Love Story */}
              {currentItem.image && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: currentItem.image }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Nút chọn ảnh Love Story */}
              <TouchableOpacity
                style={styles.pickImageButton}
                onPress={() => handlePickImage("image")}
                disabled={uploadingImage}
              >
                <ImagePlus size={20} color="#ff6b9d" />
                <Text style={styles.pickImageText}>
                  {uploadingImage
                    ? "Đang tải..."
                    : currentItem.image
                      ? "Thay đổi ảnh"
                      : "Chọn ảnh minh họa"}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSaveItemInModal}
                >
                  <Text style={{ color: "#fff" }}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      );
    }
    if (sectionType === "events") {
      return (
        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Chỉnh sửa" : "Thêm mới"} Sự kiện
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Tên sự kiện (vd: Lễ Gia Tiên)"
                value={currentItem.name}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Thời gian (vd: 09:00, 20/12/2025)"
                value={currentItem.time}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, time: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Địa điểm (vd: Nhà trai)"
                value={currentItem.venue}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, venue: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                value={currentItem.address}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, address: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Link Google Maps (Xem bản đồ)"
                value={currentItem.mapLink}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, mapLink: text })
                }
              />
              {/* --- THÊM INPUT MỚI CHO EMBED MAP URL --- */}
              <TextInput
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]} // Tăng chiều cao, cho phép nhiều dòng
                placeholder="Dán toàn bộ mã HTML nhúng của Google Maps vào đây" // Placeholder mới
                value={currentItem.embedMapUrl}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, embedMapUrl: text })
                }
                multiline={true} // Cho phép dán nhiều dòng
                autoCapitalize="none"
              />
              <Text
                style={[styles.hintText, { marginTop: -10, marginBottom: 10 }]}
              >
                Lên Google Maps &gt; Chia sẻ &gt; Nhúng bản đồ &gt; Sao chép
                HTML &gt; Dán hết vào ô trên.
              </Text>
              {/* --- KẾT THÚC THÊM INPUT --- */}
              <TextInput
                style={styles.input}
                placeholder="URL ảnh minh họa (tùy chọn)"
                value={currentItem.image}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, image: text })
                }
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSaveItemInModal}
                >
                  <Text style={{ color: "#fff" }}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            {title}
          </Text>
        </View>
        {["album", "loveStory", "events"].includes(sectionType) ? (
          <TouchableOpacity onPress={openModalToAdd}>
            <Plus size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: responsiveWidth(24) }} />
        )}
      </View>

      {renderContent()}
      {renderModal()}

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            marginBottom:
              Platform.OS === "android" ? Math.max(insets.bottom, 20) : 20,
          },
        ]}
        onPress={handleSaveChanges}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu Thay Đổi</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // keep subtle bottom border for separation
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
  },
  headerTitle: {
    fontFamily: "MavenPro-Bold",
    fontSize: responsiveFont(20),
    fontWeight: "700",
    color: COLORS.white,
  },
  formContainer: { padding: responsiveWidth(20) },
  label: { fontSize: responsiveFont(16), fontWeight: "600", color: COLORS.textPrimary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    marginBottom: responsiveHeight(15),
    fontSize: responsiveFont(16),
    backgroundColor: COLORS.card, // Đảm bảo input có nền trắng
  },
  hintText: {
    fontSize: responsiveFont(14),
    color: COLORS.textSecondary,
    marginTop: -5,
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: responsiveWidth(16),
    margin: responsiveWidth(20),
    borderRadius: responsiveWidth(8),
    alignItems: "center",
  },
  saveButtonText: { color: COLORS.white, fontSize: responsiveFont(16), fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: responsiveHeight(50), color: COLORS.textSecondary },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(15),
    backgroundColor: "#f9f9f9",
    borderRadius: responsiveWidth(8),
    marginBottom: responsiveHeight(10),
  },
  itemTitle: { fontWeight: "bold", marginBottom: responsiveHeight(5) },
  itemText: { flex: 1, marginRight: responsiveWidth(10) },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: COLORS.card,
    borderRadius: responsiveWidth(10),
    padding: responsiveWidth(20),
  },
  modalTitle: {
    fontSize: responsiveFont(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(15),
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: responsiveWidth(10),
    marginBottom: responsiveWidth(20),
  },
  modalButton: {
    padding: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(20),
    borderRadius: responsiveWidth(5),
    marginLeft: responsiveWidth(10),
  },
  confirmButton: { backgroundColor: COLORS.primary },
  imagePreviewContainer: {
    marginVertical: responsiveHeight(15),
    alignItems: "center",
  },
  imagePreview: {
    width: responsiveWidth(200),
    height: responsiveWidth(200),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#f3f4f6",
  },
  pickImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff1f5",
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    marginBottom: responsiveHeight(15),
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: responsiveWidth(8),
  },
  pickImageText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: COLORS.accent,
  },

  // 6. THÊM STYLES CHO PICKER
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: responsiveWidth(5),
    marginBottom: responsiveHeight(15),
    backgroundColor: COLORS.card, // Quan trọng trên iOS
    justifyContent: "center",
  },
  picker: {
    height: responsiveHeight(60), // Cần thiết cho Android
    width: "100%",
  },
});
