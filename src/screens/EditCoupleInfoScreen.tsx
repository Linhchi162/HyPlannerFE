// screens/EditSectionScreen.tsx

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
} from "react-native";
import { ChevronLeft, Plus, Trash2, Edit } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  RootStackParamList,
  LoveStoryItem,
  WeddingEvent,
} from "../navigation/types";
import apiClient from "../api/client";
import { useAppDispatch } from "../store/hooks";
import { fetchUserInvitation } from "../store/invitationSlice";

type EditCoupleInfoRouteProp = RouteProp<RootStackParamList, "EditCoupleInfo">;

export default function EditCoupleInfo() {
  const navigation = useNavigation();
  const route = useRoute<EditCoupleInfoRouteProp>();
  const { invitation, sectionType, title } = route.params;
  const dispatch = useAppDispatch();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

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
    }
  }, [invitation, sectionType]);

  // --- SỬA LỖI GỬI DỮ LIỆU ALBUM: Cập nhật hàm này ---
  const handleSaveChanges = async () => {
    setIsLoading(true);
    let payload = {};

    // Tạo payload một cách cẩn thận cho từng loại dữ liệu
    switch (sectionType) {
      case "coupleInfo":
        payload = data;
        break;
      case "album":
        // Với album, payload chỉ đơn giản là mảng chuỗi
        payload = { album: data };
        break;
      case "loveStory":
      case "events":
        // Với loveStory và events, chúng ta cần loại bỏ _id tạm thời
        const cleanData = data.map(({ _id, ...rest }: any) => rest);
        payload = { [sectionType]: cleanData };
        break;
      case "youtubeVideo":
        payload = { youtubeUrl: data };
        break;
    }

    try {
      await apiClient.put("/invitation/my-invitation", payload);
      dispatch(fetchUserInvitation());
      Alert.alert("Thành công", `Đã cập nhật mục "${title}"!`);
      navigation.goBack();
    } catch (error: any) {
      // Lấy thông điệp lỗi từ response của server nếu có
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể lưu thay đổi.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Các hàm còn lại giữ nguyên như cũ)
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

  const openModalToEdit = (item: any, index?: number) => {
    setIsEditing(true);
    if (sectionType === "album") {
      setCurrentItem({ url: item, index: index });
    } else {
      setCurrentItem(item);
    }
    setModalVisible(true);
  };

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

  const handleSaveItemInModal = () => {
    if (sectionType === "album") {
      if (!currentItem.url || !currentItem.url.trim()) {
        Alert.alert("Lỗi", "URL ảnh không được để trống.");
        return;
      }
      if (isEditing) {
        const newAlbum = [...(data as string[])];
        newAlbum[currentItem.index] = currentItem.url;
        setData(newAlbum);
      } else {
        setData([...(data as string[]), currentItem.url]);
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
              onChangeText={setData} // Vì data chỉ là string, có thể gán trực tiếp
            />
            <Text style={styles.hintText}>
              Dán link video YouTube của bạn vào đây. Website sẽ tự động nhúng
              video vào trang.
            </Text>
          </View>
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
                {isEditing ? "Chỉnh sửa" : "Thêm mới"} URL Ảnh
              </Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/image.jpg"
                value={currentItem.url}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, url: text })
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
              <TextInput
                style={styles.input}
                placeholder="URL ảnh minh họa"
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
                placeholder="Link Google Maps (tùy chọn)"
                value={currentItem.mapLink}
                onChangeText={(text) =>
                  setCurrentItem({ ...currentItem, mapLink: text })
                }
              />
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
      <StatusBar barStyle="dark-content" backgroundColor="#fbe2e7" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        {["album", "loveStory", "events"].includes(sectionType) ? (
          <TouchableOpacity onPress={openModalToAdd}>
            <Plus size={24} color="#374151" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {renderContent()}
      {renderModal()}

      <TouchableOpacity
        style={styles.saveButton}
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: "#fbe2e7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0d4d9",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: 18,
    fontWeight: "600",
    color: "#e07181",
  },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  hintText: {
    // <-- Thêm style này
    fontSize: 14,
    color: "#666",
    marginTop: -5,
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: "#e07181",
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#888" },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: { fontWeight: "bold", marginBottom: 5 },
  itemText: { flex: 1, marginRight: 10 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
  },
  confirmButton: { backgroundColor: "#e07181" },
});
