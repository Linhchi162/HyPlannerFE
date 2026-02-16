import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Modal,
} from "react-native";
import { ChevronLeft, MessageCircle, Star } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import {
  getCachedVendors,
  getVendorDetail,
  getVendorUserRating,
  rateVendor,
  submitVendorRequest,
  Vendor,
  VendorServiceItem,
} from "../../service/vendorService";
import { ensureChat, sendChatMessage } from "../../service/chatService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";

export default function VendorDetailScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const vendorId = (route.params as { vendorId: string })?.vendorId;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<
    VendorServiceItem[]
  >([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const cachedList = await getCachedVendors();
        const cached = cachedList.find((v) => v.id === vendorId);
        if (isMounted && cached) {
          setVendor(cached);
          setLoading(false);
        }
        const data = await getVendorDetail(vendorId);
        if (isMounted) setVendor(data);
        const userId =
          currentUser?.id || currentUser?._id || currentUser?.uid;
        if (isMounted && userId && vendorId) {
          const existing = await getVendorUserRating(vendorId, userId);
          if (existing) {
            setSelectedRating(existing);
            setHasRated(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [vendorId, currentUser]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nhà cung cấp</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : !vendor ? (
          <Text style={styles.emptyText}>Không tìm thấy nhà cung cấp.</Text>
        ) : (
          <>
            {vendor.imageUrl ? (
              <Image source={{ uri: vendor.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderText}>
                  {(vendor.name || "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {vendor.rating ?? 0} • {vendor.ratingCount ?? 0} đánh giá
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Đánh giá</Text>
            <View style={styles.ratingSelectRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => {
                    if (!hasRated) setSelectedRating(n);
                  }}
                  disabled={hasRated}
                >
                  <Star
                    size={22}
                    color={n <= selectedRating ? "#f59e0b" : "#e5e7eb"}
                    fill={n <= selectedRating ? "#f59e0b" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.outlineBtn,
                ratingSubmitting && styles.primaryBtnDisabled,
                hasRated && styles.primaryBtnDisabled,
              ]}
              onPress={async () => {
                if (!vendor) return;
                if (selectedRating === 0) {
                  Alert.alert("Thiếu đánh giá", "Vui lòng chọn số sao.");
                  return;
                }
                const userId =
                  currentUser?.id ||
                  currentUser?._id ||
                  currentUser?.uid;
                if (!userId) {
                  Alert.alert(
                    "Chưa đăng nhập",
                    "Vui lòng đăng nhập để đánh giá."
                  );
                  return;
                }
                try {
                  setRatingSubmitting(true);
                  await rateVendor(vendor.id, userId, selectedRating);
                  setHasRated(true);
                  Alert.alert("Cảm ơn", "Đã ghi nhận đánh giá của bạn.");
                } catch (err: any) {
                  if (err?.message === "already-rated") {
                    setHasRated(true);
                    Alert.alert(
                      "Đã đánh giá",
                      "Mỗi tài khoản chỉ được đánh giá một lần."
                    );
                  } else {
                    Alert.alert("Lỗi", "Không thể gửi đánh giá.");
                  }
                } finally {
                  setRatingSubmitting(false);
                }
              }}
              disabled={ratingSubmitting || hasRated}
            >
              <Text style={styles.outlineBtnText}>
                {hasRated
                  ? "Bạn đã đánh giá"
                  : ratingSubmitting
                  ? "Đang gửi..."
                  : "Gửi đánh giá"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <Text style={styles.sectionText}>{vendor.category}</Text>
            <Text style={styles.sectionTitle}>Khu vực hoạt động</Text>
            <Text style={styles.sectionText}>{vendor.location}</Text>
            <Text style={styles.sectionTitle}>Số điện thoại</Text>
            <Text style={styles.sectionText}>
              {vendor.phone?.trim()
                ? vendor.phone
                : "Nhà cung cấp chưa cập nhật số điện thoại."}
            </Text>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.sectionText}>
              {vendor.description?.trim()
                ? vendor.description
                : "Nhà cung cấp chưa cập nhật mô tả."}
            </Text>

           
            {Array.isArray(vendor.galleryUrls) && vendor.galleryUrls.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryRow}
              >
                {vendor.galleryUrls.slice(0, 6).map((url) => (
                  <TouchableOpacity
                    key={url}
                    onPress={() => setPreviewImage(url)}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.galleryImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.sectionText}>
                Nhà cung cấp chưa cập nhật ảnh.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Dịch vụ cung cấp</Text>
            {Array.isArray(vendor.services) && vendor.services.length > 0 ? (
              <View style={styles.serviceList}>
                {vendor.services.map((s) => {
                  const isSelected = selectedServices.some(
                    (item) => item.id === s.id
                  );
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() =>
                        setSelectedServices((prev) =>
                          prev.some((item) => item.id === s.id)
                            ? prev.filter((item) => item.id !== s.id)
                            : [...prev, s]
                        )
                      }
                      style={[
                        styles.serviceChip,
                        isSelected && styles.serviceChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.serviceChipText,
                          isSelected && styles.serviceChipTextActive,
                        ]}
                      >
                        {s.name}
                        {s.price ? ` • ${s.price}` : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.sectionText}>
                Nhà cung cấp chưa cập nhật dịch vụ.
              </Text>
            )}

            <View style={styles.requestBox}>
              <Text style={styles.sectionTitle}>Đăng ký dịch vụ</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Ghi chú thêm (ngày tổ chức, yêu cầu...)"
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (submitting ||
                    !Array.isArray(vendor.services) ||
                    vendor.services.length === 0) &&
                  styles.primaryBtnDisabled,
                ]}
                onPress={async () => {
                  if (!vendor) return;
                  if (
                    !Array.isArray(vendor.services) ||
                    vendor.services.length === 0
                  ) {
                    Alert.alert(
                      "Chưa có dịch vụ",
                      "Nhà cung cấp chưa cập nhật dịch vụ."
                    );
                    return;
                  }
                  const userId =
                    currentUser?.id ||
                    currentUser?._id ||
                    currentUser?.uid;
                  const userName =
                    currentUser?.name || currentUser?.fullName || "Khách hàng";
                  if (!userId) {
                    Alert.alert(
                      "Chưa đăng nhập",
                      "Vui lòng đăng nhập để gửi yêu cầu."
                    );
                    return;
                  }
                  if (selectedServices.length === 0) {
                    Alert.alert(
                      "Thiếu dịch vụ",
                      "Vui lòng chọn ít nhất một dịch vụ."
                    );
                    return;
                  }
                  try {
                    setSubmitting(true);
                    const timeoutMs = 12000;
                    const requestPayload = {
                      vendorId: vendor.id,
                      vendorName: vendor.name,
                      userId,
                      userName,
                      userEmail: currentUser?.email,
                      services: selectedServices,
                      note: note.trim(),
                    };
                    await Promise.race([
                      submitVendorRequest(requestPayload),
                      new Promise((_, reject) =>
                        setTimeout(
                          () => reject(new Error("timeout")),
                          timeoutMs
                        )
                      ),
                    ]);
                    const chatId = await ensureChat({
                      userId,
                      vendorId: vendor.id,
                      userName,
                      vendorName: vendor.name,
                      vendorImageUrl: vendor.imageUrl || null,
                      userImageUrl:
                        currentUser?.picture ||
                        currentUser?.avatar ||
                        currentUser?.photoUrl ||
                        currentUser?.photoURL ||
                        null,
                    });
                    const serviceText = selectedServices
                      .map((s) => s.name)
                      .join(", ");
                    const content = [
                      "Khách hàng đăng ký dịch vụ:",
                      serviceText,
                      note.trim() ? `Ghi chú: ${note.trim()}` : null,
                    ]
                      .filter(Boolean)
                      .join("\n");
                    await sendChatMessage({
                      chatId,
                      text: content,
                      senderId: userId,
                      senderRole: "user",
                      senderImageUrl:
                        currentUser?.picture ||
                        currentUser?.avatar ||
                        currentUser?.photoUrl ||
                        currentUser?.photoURL ||
                        null,
                    });
                    setNote("");
                    Alert.alert(
                      "Đã gửi yêu cầu",
                      "Nhà cung cấp sẽ nhận thông báo trong tin nhắn."
                    );
                  } catch (err: any) {
                    const isTimeout = err?.message === "timeout";
                    Alert.alert(
                      "Gửi thất bại",
                      isTimeout
                        ? "Kết nối đang chậm. Vui lòng thử lại."
                        : "Vui lòng thử lại sau."
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={
                  submitting ||
                  !Array.isArray(vendor.services) ||
                  vendor.services.length === 0
                }
              >
                <Text style={styles.primaryBtnText}>
                  {submitting
                    ? "Đang gửi..."
                    : `Đăng ký dịch vụ (${selectedServices.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  navigation.navigate("ChatDetail", {
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    vendorImageUrl: vendor.imageUrl,
                    role: "user",
                  })
                }
              >
                <MessageCircle size={18} color="#ffffff" />
                <Text style={styles.primaryBtnText}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!previewImage} transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.previewCloseText}>×</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
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
    paddingVertical: responsiveHeight(24),
  },
  loadingText: {
    marginTop: responsiveHeight(8),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
  },
  vendorName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(20),
    color: "#111827",
    marginBottom: responsiveHeight(6),
  },
  heroImage: {
    width: "100%",
    height: responsiveHeight(180),
    borderRadius: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
    backgroundColor: "#ffe4ea",
  },
  heroPlaceholder: {
    width: "100%",
    height: responsiveHeight(180),
    borderRadius: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
    backgroundColor: "#ffe4ea",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(28),
    color: "#ff5a7a",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    marginBottom: responsiveHeight(16),
  },
  ratingSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
    marginTop: responsiveHeight(6),
    marginBottom: responsiveHeight(8),
  },
  ratingText: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  sectionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#111827",
    marginTop: responsiveHeight(10),
  },
  sectionText: {
    fontSize: responsiveFont(13),
    color: "#4b5563",
    marginTop: responsiveHeight(4),
  },
  serviceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
    marginTop: responsiveHeight(8),
  },
  serviceChip: {
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(14),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  serviceChipActive: {
    backgroundColor: "#ff5a7a",
    borderColor: "#ff5a7a",
  },
  serviceChipText: {
    fontSize: responsiveFont(12),
    color: "#374151",
  },
  serviceChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  galleryRow: {
    marginTop: responsiveHeight(8),
    gap: responsiveWidth(8),
    paddingBottom: responsiveHeight(4),
  },
  galleryImage: {
    width: responsiveWidth(120),
    height: responsiveWidth(90),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#ffe4ea",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(16),
  },
  previewImage: {
    width: "100%",
    height: "80%",
  },
  previewClose: {
    position: "absolute",
    right: responsiveWidth(16),
    top: responsiveHeight(30),
    width: responsiveWidth(36),
    height: responsiveWidth(36),
    borderRadius: responsiveWidth(18),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    color: "#ffffff",
    fontSize: responsiveFont(22),
    lineHeight: responsiveFont(22),
  },
  requestBox: {
    marginTop: responsiveHeight(18),
    padding: responsiveWidth(12),
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    gap: responsiveHeight(10),
  },
  noteInput: {
    minHeight: responsiveHeight(80),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(10),
    fontSize: responsiveFont(12),
    color: "#111827",
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
  },
  actionsRow: {
    marginTop: responsiveHeight(20),
    flexDirection: "row",
    gap: responsiveWidth(12),
  },
  primaryBtn: {
    flex: 1,
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
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ff5a7a",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  outlineBtnText: {
    color: "#ff5a7a",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
});
