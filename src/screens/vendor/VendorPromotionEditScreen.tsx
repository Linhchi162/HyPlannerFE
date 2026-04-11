import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Save, Search } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  RootStackParamList,
  VendorStackParamList,
} from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  createPromotion,
  getPromotion,
  logPromotionError,
  PromotionInput,
  setPromotionImageUrl,
  updatePromotion,
} from "../../service/promotionService";
import { getVendorProfileByUid } from "../../service/vendorService";
import {
  VENDOR_SERVICE_CATEGORIES,
  normalizePromotionCategoryId,
} from "../../constants/vendorServiceCategories";
import { auth, storage } from "../../service/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type Nav = StackNavigationProp<RootStackParamList & VendorStackParamList>;
type PromoEditRoute = RouteProp<
  VendorStackParamList,
  "VendorPromotionEdit"
>;

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
}

function formatInputDate(v: unknown): string {
  const d = toDate(v);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseInputDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  if (slash) {
    const d = Number(slash[1]);
    const m = Number(slash[2]);
    const y = Number(slash[3]);
    const out = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (
      out.getFullYear() === y &&
      out.getMonth() === m - 1 &&
      out.getDate() === d
    ) {
      return out;
    }
    return null;
  }
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const out = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (
      out.getFullYear() === y &&
      out.getMonth() === m - 1 &&
      out.getDate() === d
    ) {
      return out;
    }
    return null;
  }
  return null;
}

export default function VendorPromotionEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PromoEditRoute>();
  const promotionId = route.params?.promotionId;

  const [loading, setLoading] = useState(!!promotionId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("photo");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [section, setSection] = useState<"hot" | "dress">("dress");
  const [active, setActive] = useState(true);
  const [validFromText, setValidFromText] = useState("");
  const [validToText, setValidToText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");

  const filteredVendorCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return VENDOR_SERVICE_CATEGORIES;
    return VENDOR_SERVICE_CATEGORIES.filter(
      (c) =>
        c.short.toLowerCase().includes(q) ||
        c.full.toLowerCase().includes(q)
    );
  }, [categoryQuery]);

  const selectedCategory = useMemo(
    () => VENDOR_SERVICE_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const profile = await getVendorProfileByUid(uid);
        if (mounted && profile?.name) setVendorName(profile.name);
        if (promotionId) {
          const p = await getPromotion(promotionId);
          if (!mounted) return;
          if (!p) {
            logPromotionError(
              "VendorPromotionEditScreen.load",
              new Error(`Không tìm thấy promotion id=${promotionId}`)
            );
            Alert.alert("Lỗi", "Không tải được khuyến mãi.");
            navigation.goBack();
            return;
          }
          if (p.vendorId !== uid) {
            Alert.alert("Lỗi", "Không có quyền sửa mục này.");
            navigation.goBack();
            return;
          }
          setTitle(p.title);
          setDescription((p.description || "").trim());
          setCategoryId(normalizePromotionCategoryId(p.category));
          setSection(p.section);
          setActive(p.active);
          setValidFromText(formatInputDate(p.validFrom));
          setValidToText(formatInputDate(p.validTo));
          setImageUrl(p.imageUrl || null);
        }
      } catch (e) {
        logPromotionError("VendorPromotionEditScreen.load", e);
        if (mounted) {
          Alert.alert("Lỗi", "Không tải dữ liệu. Xem log Metro (console).");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [promotionId, navigation]);

  const uploadImageUri = async (uri: string, docId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("no uid");
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `promotions/${uid}/${docId}.jpg`);
      await uploadBytes(fileRef, blob);
      return getDownloadURL(fileRef);
    } catch (e) {
      logPromotionError(
        `uploadImageUri Storage promotions/${uid}/${docId}.jpg`,
        e
      );
      throw e;
    }
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Cần quyền", "Cho phép truy cập thư viện ảnh để chọn poster.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUrl(result.assets[0].uri);
  };

  const onSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Chưa đăng nhập.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Nhập tiêu đề khuyến mãi.");
      return;
    }
    const parsedFrom = parseInputDate(validFromText);
    const parsedTo = parseInputDate(validToText);
    if (validFromText.trim() && !parsedFrom) {
      Alert.alert(
        "Sai định dạng",
        "Ngày bắt đầu không hợp lệ. Dùng dd/mm/yyyy hoặc yyyy-mm-dd."
      );
      return;
    }
    if (validToText.trim() && !parsedTo) {
      Alert.alert(
        "Sai định dạng",
        "Ngày kết thúc không hợp lệ. Dùng dd/mm/yyyy hoặc yyyy-mm-dd."
      );
      return;
    }
    if (parsedFrom && parsedTo && parsedFrom.getTime() > parsedTo.getTime()) {
      Alert.alert("Sai thời hạn", "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }
    const name = vendorName.trim() || "Nhà cung cấp";
    setSaving(true);
    try {
      const isRemoteImage =
        !!imageUrl && /^https?:\/\//i.test(imageUrl);
      const base: PromotionInput = {
        vendorId: uid,
        vendorName: name,
        title: title.trim(),
        description: description.trim(),
        imageUrl: isRemoteImage ? imageUrl! : "",
        category: categoryId,
        section,
        active,
        validFrom: parsedFrom ?? null,
        validTo: parsedTo ?? null,
      };

      if (promotionId) {
        let nextUrl = base.imageUrl;
        if (imageUrl && !isRemoteImage) {
          setUploading(true);
          nextUrl = await uploadImageUri(imageUrl, promotionId);
          setUploading(false);
          setImageUrl(nextUrl);
        }
        await updatePromotion(promotionId, { ...base, imageUrl: nextUrl });
        navigation.goBack();
        Alert.alert("Đã lưu", "Khuyến mãi đã cập nhật.");
        return;
      } else {
        if (!imageUrl?.trim()) {
          Alert.alert("Ảnh", "Chọn ảnh poster cho khuyến mãi.");
          setSaving(false);
          return;
        }
        if (isRemoteImage) {
          await createPromotion({ ...base, imageUrl: imageUrl! });
          navigation.goBack();
          Alert.alert("Đã tạo", "Khuyến mãi đã được thêm.");
          return;
        }
        const id = await createPromotion({
          ...base,
          imageUrl: "",
        });
        setUploading(true);
        const url = await uploadImageUri(imageUrl, id);
        await setPromotionImageUrl(id, url);
        setUploading(false);
        setImageUrl(url);
        navigation.goBack();
        Alert.alert(
          "Đã tạo",
          "Khuyến mãi đã được thêm. Bật Hiển thị ở danh sách nếu cần."
        );
        return;
      }
    } catch (e) {
      setUploading(false);
      logPromotionError("VendorPromotionEditScreen.onSave", e);
      Alert.alert("Lỗi", "Không lưu được. Kiểm tra mạng hoặc quyền Firebase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={["top"]}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={pinkHeaderStyles.titleContainer}>
            <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
              {promotionId ? "Sửa khuyến mãi" : "Khuyến mãi mới"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void onSave()}
            disabled={saving || loading}
          >
            <Save size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#f7577c" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.label}>Ảnh poster</Text>
            <TouchableOpacity
              style={styles.imagePick}
              onPress={() => void handlePickImage()}
              disabled={uploading}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.imageHint}>Chạm để chọn ảnh</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Giảm 10% cho khách HyPlanner"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Chi tiết ưu đãi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả nội dung, điều kiện áp dụng, giới hạn..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Thời hạn hiệu lực</Text>
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>Từ ngày</Text>
                <TextInput
                  style={styles.input}
                  value={validFromText}
                  onChangeText={setValidFromText}
                  placeholder="dd/mm/yyyy"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>Đến ngày</Text>
                <TextInput
                  style={styles.input}
                  value={validToText}
                  onChangeText={setValidToText}
                  placeholder="dd/mm/yyyy"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <Text style={styles.label}>Danh mục (giống hồ sơ vendor)</Text>
            <TouchableOpacity
              style={styles.categorySelect}
              onPress={() => setCategoryModalVisible(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.categorySelectShort}>
                  {selectedCategory?.short ?? categoryId}
                </Text>
                <Text style={styles.categorySelectFull} numberOfLines={2}>
                  {selectedCategory?.full ?? "Chọn danh mục"}
                </Text>
              </View>
              <Text style={styles.categorySelectHint}>Chọn</Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>
              Hot deal do Admin quản lý. Mục khuyến mãi vendor sẽ giữ nhóm hiện
              tại và không cho chọn thủ công.
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Hiển thị cho khách</Text>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: "#d1d5db", true: "#f9a8c4" }}
                thumbColor={active ? "#f7577c" : "#f3f4f6"}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={() => void onSave()}
              disabled={saving}
            >
              {saving || uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <Modal visible={categoryModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.modalSearchRow}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Tìm theo tên ngắn hoặc đầy đủ..."
              placeholderTextColor="#9ca3af"
              value={categoryQuery}
              onChangeText={setCategoryQuery}
            />
          </View>
          <FlatList
            data={filteredVendorCategories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setCategoryId(item.id);
                  setCategoryModalVisible(false);
                  setCategoryQuery("");
                }}
              >
                <Text style={styles.modalItemShort}>{item.short}</Text>
                <Text style={styles.modalItemFull}>{item.full}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmpty}>Không tìm thấy.</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: { flex: 1, backgroundColor: "#f7577c" },
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#f7577c",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    minHeight: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontFamily: "Roboto",
    fontSize: responsiveFont(17),
    fontWeight: "700",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
  },
  label: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
    color: "#374151",
    marginBottom: responsiveHeight(6),
    marginTop: responsiveHeight(12),
  },
  imagePick: {
    height: responsiveHeight(160),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  poster: { width: "100%", height: "100%" },
  imageHint: { color: "#9ca3af", fontSize: responsiveFont(13) },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(12),
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  textArea: {
    minHeight: responsiveHeight(90),
  },
  dateRow: {
    flexDirection: "row",
    gap: responsiveWidth(10),
  },
  dateLabel: {
    marginBottom: responsiveHeight(6),
    color: "#6b7280",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(11),
  },
  infoText: {
    marginTop: responsiveHeight(12),
    fontSize: responsiveFont(12),
    color: "#6b7280",
    lineHeight: responsiveFont(18),
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(16),
  },
  saveBtn: {
    marginTop: responsiveHeight(24),
    backgroundColor: "#f7577c",
    paddingVertical: responsiveHeight(14),
    borderRadius: responsiveWidth(12),
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(15),
  },
  categorySelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(12),
  },
  categorySelectShort: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  categorySelectFull: {
    marginTop: 4,
    fontSize: responsiveFont(11),
    color: "#6b7280",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  categorySelectHint: {
    fontSize: responsiveFont(12),
    color: "#f7577c",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  modalSafe: { flex: 1, backgroundColor: "#f8f9fa" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(16),
    color: "#111827",
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(12),
    borderRadius: responsiveWidth(10),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: responsiveWidth(8),
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: responsiveHeight(10),
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  modalList: { padding: responsiveWidth(16), paddingBottom: 40 },
  modalItem: {
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(10),
    padding: responsiveWidth(12),
    marginBottom: responsiveHeight(8),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  modalItemShort: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  modalItemFull: {
    marginTop: 4,
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  modalEmpty: { textAlign: "center", color: "#9ca3af", marginTop: 24 },
});
