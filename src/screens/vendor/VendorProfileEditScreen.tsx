import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { ChevronLeft, Save, Trash2, Search, ChevronDown } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  getVendorProfileByUid,
  updateVendorProfile,
  getCachedVendorProfile,
  setCachedVendorProfile,
  subscribeVendorProfile,
  deleteVendorProfile,
} from "../../service/vendorService";
import { auth, storage } from "../../service/firebase";
import { logoutVendor } from "../../service/vendorAuthService";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function VendorProfileEditScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");

  const CITY_OPTIONS = useMemo(
    () => [
      "Hà Nội",
      "TP. Hồ Chí Minh",
      "Đà Nẵng",
      "Hải Phòng",
      "Cần Thơ",
      "An Giang",
      "Bà Rịa - Vũng Tàu",
      "Bắc Giang",
      "Bắc Kạn",
      "Bạc Liêu",
      "Bắc Ninh",
      "Bến Tre",
      "Bình Định",
      "Bình Dương",
      "Bình Phước",
      "Bình Thuận",
      "Cà Mau",
      "Cao Bằng",
      "Đắk Lắk",
      "Đắk Nông",
      "Điện Biên",
      "Đồng Nai",
      "Đồng Tháp",
      "Gia Lai",
      "Hà Giang",
      "Hà Nam",
      "Hà Tĩnh",
      "Hải Dương",
      "Hậu Giang",
      "Hòa Bình",
      "Hưng Yên",
      "Khánh Hòa",
      "Kiên Giang",
      "Kon Tum",
      "Lai Châu",
      "Lâm Đồng",
      "Lạng Sơn",
      "Lào Cai",
      "Long An",
      "Nam Định",
      "Nghệ An",
      "Ninh Bình",
      "Ninh Thuận",
      "Phú Thọ",
      "Phú Yên",
      "Quảng Bình",
      "Quảng Nam",
      "Quảng Ngãi",
      "Quảng Ninh",
      "Quảng Trị",
      "Sóc Trăng",
      "Sơn La",
      "Tây Ninh",
      "Thái Bình",
      "Thái Nguyên",
      "Thanh Hóa",
      "Thừa Thiên Huế",
      "Tiền Giang",
      "Trà Vinh",
      "Tuyên Quang",
      "Vĩnh Long",
      "Vĩnh Phúc",
      "Yên Bái",
    ],
    []
  );

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return CITY_OPTIONS;
    const q = cityQuery.toLowerCase();
    return CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [CITY_OPTIONS, cityQuery]);

  const CATEGORY_OPTIONS = useMemo(
    () => [
      "Wedding Planner (Tổ chức/Điều phối)",
      "Địa điểm & Tiệc cưới",
      "Trang trí & Decor",
      "Chụp ảnh cưới",
      "Quay phim/Phóng sự cưới",
      "Trang điểm & Làm tóc",
      "Áo cưới/Váy cưới",
      "Vest chú rể",
      "Hoa cưới",
      "Thiệp cưới",
      "Xe hoa",
      "MC & Ban nhạc",
      "Mâm quả/Tráp cưới",
      "Bánh cưới",
      "Âm thanh & Ánh sáng",
      "Backdrop & Photobooth",
    ],
    []
  );

  const filteredCategories = useMemo(() => {
    if (!categoryQuery.trim()) return CATEGORY_OPTIONS;
    const q = categoryQuery.toLowerCase();
    return CATEGORY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [CATEGORY_OPTIONS, categoryQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          if (isMounted) setLoading(false);
          return;
        }
        const cached = await getCachedVendorProfile(uid);
        if (isMounted && cached) {
          setName(cached.name || "");
          setCategory(cached.category || "");
          setLocation(cached.location || "");
          setPhone(cached.phone || "");
          setDescription(cached.description || "");
          setImageUrl(cached.imageUrl || null);
          setGalleryUrls(cached.galleryUrls || []);
        }
        const unsub = subscribeVendorProfile(uid, (data) => {
          if (!isMounted || !data) return;
          setName(data.name || "");
          setCategory(data.category || "");
          setLocation(data.location || "");
          setPhone(data.phone || "");
          setDescription(data.description || "");
          setImageUrl(data.imageUrl || null);
          setGalleryUrls(data.galleryUrls || []);
        });
        if (isMounted) setLoading(false);
        return unsub;
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    let cleanup: undefined | (() => void);
    load().then((unsub) => {
      cleanup = typeof unsub === "function" ? unsub : undefined;
    });
    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Chưa đăng nhập vendor.");
      return;
    }
    if (!name.trim() || !category.trim() || !location.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setSaving(true);
      await updateVendorProfile(uid, {
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
        phone: phone.trim(),
        description: description.trim(),
      });
      Alert.alert("Thành công", "Đã lưu hồ sơ.");
    } catch {
      Alert.alert("Lỗi", "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh để thay đổi ảnh."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Lỗi", "Chưa đăng nhập vendor.");
        return;
      }

      setUploadingImage(true);
      const imageUri = result.assets[0].uri;
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileRef = ref(storage, `vendors/${uid}/profile.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      await updateVendorProfile(uid, { imageUrl: url });
      setImageUrl(url);
      Alert.alert("Thành công", "Đã cập nhật ảnh.");
    } catch {
      Alert.alert("Lỗi", "Không thể tải ảnh lên.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickGallery = async () => {
    try {
      if (galleryUrls.length >= 6) {
        Alert.alert("Giới hạn ảnh", "Bạn chỉ được tải tối đa 6 ảnh.");
        return;
      }
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh để tải ảnh."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 6 - galleryUrls.length,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Lỗi", "Chưa đăng nhập vendor.");
        return;
      }

      setUploadingGallery(true);
      const uploads = await Promise.all(
        result.assets.map(async (asset, idx) => {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const fileRef = ref(
            storage,
            `vendors/${uid}/gallery/${Date.now()}_${idx}.jpg`
          );
          await uploadBytes(fileRef, blob);
          return await getDownloadURL(fileRef);
        })
      );
      const next = [...galleryUrls, ...uploads].slice(0, 6);
      await updateVendorProfile(uid, { galleryUrls: next });
      setGalleryUrls(next);
      Alert.alert("Thành công", "Đã cập nhật ảnh mô tả.");
    } catch {
      Alert.alert("Lỗi", "Không thể tải ảnh lên.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGallery = async (url: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Chưa đăng nhập vendor.");
      return;
    }
    const next = galleryUrls.filter((u) => u !== url);
    setGalleryUrls(next);
    await updateVendorProfile(uid, { galleryUrls: next });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Chỉnh sửa hồ sơ
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
          </View>
        )}

        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageWrap}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {(name || "V").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            {uploadingImage && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.imageHint}>Chạm để cập nhật ảnh</Text>
        </View>

        <Text style={styles.label}>Tên nhà cung cấp</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Studio Ánh Dương"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Danh mục dịch vụ</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.selectText,
              !category && styles.selectPlaceholder,
            ]}
          >
            {category || "Chọn danh mục dịch vụ"}
          </Text>
          <ChevronDown size={18} color="#9ca3af" />
        </TouchableOpacity>

        <Text style={styles.label}>Khu vực hoạt động</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setCityModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.selectText,
              !location && styles.selectPlaceholder,
            ]}
          >
            {location || "Chọn khu vực hoạt động"}
          </Text>
          <ChevronDown size={18} color="#9ca3af" />
        </TouchableOpacity>

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="09xx xxx xxx"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Giới thiệu</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Giới thiệu ngắn về nhà cung cấp..."
          placeholderTextColor="#9ca3af"
          multiline
        />

        <Text style={styles.label}>Ảnh mô tả (tối đa 6)</Text>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryHint}>
            {galleryUrls.length}/6 ảnh
          </Text>
          <TouchableOpacity
            style={styles.galleryAddBtn}
            onPress={handlePickGallery}
            disabled={uploadingGallery}
          >
            {uploadingGallery ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.galleryAddText}>Thêm ảnh</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.galleryGrid}>
          {galleryUrls.map((url) => (
            <View key={url} style={styles.galleryItem}>
              <Image source={{ uri: url }} style={styles.galleryImage} />
              <TouchableOpacity
                style={styles.galleryRemoveBtn}
                onPress={() => handleRemoveGallery(url)}
              >
                <Text style={styles.galleryRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("VendorChangePassword")}
          disabled={saving}
        >
          <Text style={styles.secondaryBtnText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => {
            Alert.alert(
              "Xóa hồ sơ nhà cung cấp",
              "Hành động này sẽ xóa hồ sơ trên Firebase và đăng xuất. Bạn chắc chắn?",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Xóa",
                  style: "destructive",
                  onPress: async () => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) {
                      Alert.alert("Lỗi", "Chưa đăng nhập vendor.");
                      return;
                    }
                    try {
                      setSaving(true);
                      await deleteVendorProfile(uid);
                      await logoutVendor();
                      Alert.alert("Đã xóa", "Hồ sơ đã được xóa.");
                      navigation.goBack();
                    } catch {
                      Alert.alert("Lỗi", "Không thể xóa hồ sơ.");
                    } finally {
                      setSaving(false);
                    }
                  },
                },
              ]
            );
          }}
          disabled={saving}
        >
          <Trash2 size={18} color="#ffffff" />
          <Text style={styles.dangerBtnText}>Xóa hồ sơ nhà cung cấp</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={cityModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn thành phố</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchRow}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm thành phố..."
              placeholderTextColor="#9ca3af"
              value={cityQuery}
              onChangeText={setCityQuery}
            />
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.cityList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={() => {
                  setLocation(item);
                  setCityModalVisible(false);
                  setCityQuery("");
                }}
              >
                <Text style={styles.cityText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyCityText}>
                Không tìm thấy thành phố.
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      <Modal visible={categoryModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchRow}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm danh mục..."
              placeholderTextColor="#9ca3af"
              value={categoryQuery}
              onChangeText={setCategoryQuery}
            />
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.cityList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={() => {
                  setCategory(item);
                  setCategoryModalVisible(false);
                  setCategoryQuery("");
                }}
              >
                <Text style={styles.cityText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyCityText}>
                Không tìm thấy danh mục.
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    height: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(12),
  },
  loadingText: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  label: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#111827",
    marginTop: responsiveHeight(12),
    marginBottom: responsiveHeight(6),
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  imageSection: {
    alignItems: "center",
    marginBottom: responsiveHeight(12),
  },
  imageWrap: {
    width: responsiveWidth(96),
    height: responsiveWidth(96),
    borderRadius: responsiveWidth(48),
    overflow: "hidden",
    backgroundColor: "#ffe4ea",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ffe4ea",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(24),
    color: "#ff5a7a",
  },
  imageOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageHint: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(11),
    color: "#6b7280",
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(8),
  },
  galleryHint: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  galleryAddBtn: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(8),
  },
  galleryAddText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
    marginBottom: responsiveHeight(12),
  },
  galleryItem: {
    width: responsiveWidth(90),
    height: responsiveWidth(90),
    borderRadius: responsiveWidth(10),
    overflow: "hidden",
    backgroundColor: "#ffe4ea",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryRemoveBtn: {
    position: "absolute",
    right: responsiveWidth(6),
    top: responsiveWidth(6),
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: responsiveWidth(11),
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryRemoveText: {
    color: "#ffffff",
    fontSize: responsiveFont(16),
    lineHeight: responsiveFont(16),
  },
  selectInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  selectPlaceholder: {
    color: "#9ca3af",
  },
  textArea: {
    height: responsiveHeight(90),
    paddingTop: responsiveHeight(10),
  },
  primaryBtn: {
    marginTop: responsiveHeight(20),
    backgroundColor: "#ff5a7a",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
  secondaryBtn: {
    marginTop: responsiveHeight(10),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ff5a7a",
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(10),
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#ff5a7a",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  modalTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    color: "#111827",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    borderRadius: responsiveWidth(22),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: responsiveWidth(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  cityList: {
    padding: responsiveWidth(16),
    gap: responsiveHeight(8),
  },
  cityItem: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(10),
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cityText: {
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  emptyCityText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
  },
  dangerBtn: {
    marginTop: responsiveHeight(12),
    backgroundColor: "#ef4444",
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  dangerBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
});
