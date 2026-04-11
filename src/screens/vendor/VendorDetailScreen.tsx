import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MessageCircle, Star } from "lucide-react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  getCachedVendors,
  getVendorDetail,
  getVendorUserRating,
  rateVendor,
  submitVendorRequest,
  userHasCompletedVendorRequest,
  Vendor,
  VendorServiceItem,
} from "../../service/vendorService";
import {
  getPromotion,
  subscribeActivePromotions,
  type Promotion,
} from "../../service/promotionService";
import { getSavedPromotionEntries } from "../../service/savedPromotionsService";
import { ensureChat, sendChatMessage } from "../../service/chatService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";

export default function VendorDetailScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { vendorId, promotionId: routePromotionId } =
    (route.params as { vendorId: string; promotionId?: string }) || {
      vendorId: "",
    };
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
  /** Đã có yêu cầu dịch vụ trạng thái "done" — mới được đánh giá */
  const [canRateAfterService, setCanRateAfterService] = useState(false);
  const [livePromotions, setLivePromotions] = useState<Promotion[]>([]);
  const [applicablePromoOffers, setApplicablePromoOffers] = useState<
    { id: string; title: string; imageUrl: string }[]
  >([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
    null
  );
  const [promoPickerTick, setPromoPickerTick] = useState(0);
  const didApplyRoutePromo = useRef(false);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    const unsub = subscribeActivePromotions(setLivePromotions);
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setPromoPickerTick((n) => n + 1);
    }, [])
  );

  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;
    (async () => {
      const entries = await getSavedPromotionEntries();
      const byId = new Map(livePromotions.map((p) => [p.id, p]));
      const out: { id: string; title: string; imageUrl: string }[] = [];
      const seen = new Set<string>();

      const ensurePromo = async (id: string): Promise<Promotion | null> => {
        const cached = byId.get(id);
        if (cached) return cached;
        try {
          return await getPromotion(id);
        } catch {
          return null;
        }
      };

      for (const e of entries) {
        if (e.status !== "unused" || e.isVoucher) continue;
        if (seen.has(e.promotionId)) continue;
        const p = await ensurePromo(e.promotionId);
        if (cancelled || !p || p.vendorId !== vendorId) continue;
        seen.add(p.id);
        out.push({ id: p.id, title: p.title, imageUrl: p.imageUrl || "" });
      }

      if (routePromotionId && !seen.has(routePromotionId)) {
        const p = await ensurePromo(routePromotionId);
        if (!cancelled && p && p.vendorId === vendorId) {
          seen.add(p.id);
          out.push({ id: p.id, title: p.title, imageUrl: p.imageUrl || "" });
        }
      }

      if (!cancelled) setApplicablePromoOffers(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId, livePromotions, promoPickerTick, routePromotionId]);

  useEffect(() => {
    didApplyRoutePromo.current = false;
  }, [vendorId, routePromotionId]);

  useEffect(() => {
    if (!routePromotionId || didApplyRoutePromo.current) return;
    if (applicablePromoOffers.some((o) => o.id === routePromotionId)) {
      setSelectedPromotionId(routePromotionId);
      didApplyRoutePromo.current = true;
    }
  }, [routePromotionId, applicablePromoOffers]);

  useEffect(() => {
    setSelectedPromotionId((prev) => {
      if (!prev) return prev;
      return applicablePromoOffers.some((o) => o.id === prev) ? prev : null;
    });
  }, [applicablePromoOffers]);

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
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [vendorId]);

  useFocusEffect(
    useCallback(() => {
      const userId =
        currentUser?.id || currentUser?._id || currentUser?.uid;
      if (!vendorId || !userId) {
        setCanRateAfterService(false);
        setHasRated(false);
        setSelectedRating(0);
        return;
      }
      let cancelled = false;
      (async () => {
        const [existing, completed] = await Promise.all([
          getVendorUserRating(vendorId, userId),
          userHasCompletedVendorRequest(vendorId, userId),
        ]);
        if (cancelled) return;
        if (existing) {
          setSelectedRating(existing);
          setHasRated(true);
        } else {
          setHasRated(false);
          setSelectedRating(0);
        }
        setCanRateAfterService(completed);
      })();
      return () => {
        cancelled = true;
      };
    }, [vendorId, currentUser])
  );

  const selectedPromotionTitle = selectedPromotionId
    ? applicablePromoOffers.find((o) => o.id === selectedPromotionId)?.title
    : undefined;

  const ratingUserId =
    currentUser?.id || currentUser?._id || currentUser?.uid;
  const isVendorSelf =
    !!vendor &&
    !!ratingUserId &&
    String(ratingUserId) === String(vendor.id);
  const ratingAllowed =
    !!ratingUserId && canRateAfterService && !isVendorSelf;

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={["top"]}>
      <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Chi tiết nhà cung cấp
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#f7577c" />
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
            {!ratingUserId ? (
              <Text style={styles.ratingHint}>
                Đăng nhập để xem tùy chọn đánh giá sau khi dùng dịch vụ.
              </Text>
            ) : isVendorSelf ? (
              <Text style={styles.ratingHint}>
                Bạn không thể tự đánh giá trang nhà cung cấp của chính mình.
              </Text>
            ) : hasRated ? null : !canRateAfterService ? (
              <Text style={styles.ratingHint}>
                Chỉ được đánh giá sau khi bạn đã sử dụng dịch vụ và nhà cung cấp
                xác nhận hoàn thành đơn.
              </Text>
            ) : null}
            <View style={styles.ratingSelectRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => {
                    if (!hasRated && ratingAllowed) setSelectedRating(n);
                  }}
                  disabled={hasRated || !ratingAllowed}
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
                (hasRated || !ratingAllowed) && styles.primaryBtnDisabled,
              ]}
              onPress={async () => {
                if (!vendor) return;
                if (!ratingAllowed) {
                  if (!ratingUserId) {
                    Alert.alert(
                      "Chưa đăng nhập",
                      "Vui lòng đăng nhập để đánh giá."
                    );
                  } else if (isVendorSelf) {
                    Alert.alert(
                      "Không thể đánh giá",
                      "Bạn không thể tự đánh giá trang của chính mình."
                    );
                  } else if (!canRateAfterService) {
                    Alert.alert(
                      "Chưa đủ điều kiện",
                      "Bạn chỉ có thể đánh giá sau khi đã sử dụng dịch vụ và đơn được đánh dấu hoàn thành."
                    );
                  }
                  return;
                }
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
                  const msg = err?.message;
                  if (msg === "already-rated") {
                    setHasRated(true);
                    Alert.alert(
                      "Đã đánh giá",
                      "Mỗi tài khoản chỉ được đánh giá một lần."
                    );
                  } else if (msg === "service-not-completed") {
                    Alert.alert(
                      "Chưa đủ điều kiện",
                      "Chỉ đánh giá được sau khi dịch vụ đã hoàn thành."
                    );
                  } else if (msg === "cannot-rate-self") {
                    Alert.alert(
                      "Không thể đánh giá",
                      "Bạn không thể tự đánh giá trang của chính mình."
                    );
                  } else {
                    Alert.alert("Lỗi", "Không thể gửi đánh giá.");
                  }
                } finally {
                  setRatingSubmitting(false);
                }
              }}
              disabled={ratingSubmitting || hasRated || !ratingAllowed}
            >
              <Text style={styles.outlineBtnText}>
                {hasRated
                  ? "Bạn đã đánh giá"
                  : !ratingUserId
                    ? "Đăng nhập để đánh giá"
                    : isVendorSelf
                      ? "Không thể tự đánh giá"
                      : !canRateAfterService
                        ? "Đánh giá sau khi hoàn thành dịch vụ"
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
              {applicablePromoOffers.length > 0 ? (
                <>
                  <Text style={styles.promoPickerLabel}>
                    Ưu đãi áp dụng (tuỳ chọn)
                  </Text>
                  <View style={styles.promoList}>
                    {applicablePromoOffers.map((o) => {
                      const on = selectedPromotionId === o.id;
                      return (
                        <TouchableOpacity
                          key={o.id}
                          onPress={() =>
                            navigation.navigate("PromotionDetail", {
                              promotionId: o.id,
                            })
                          }
                          style={[styles.promoRow, on && styles.promoRowActive]}
                        >
                          {o.imageUrl ? (
                            <Image
                              source={{ uri: o.imageUrl }}
                              style={styles.promoThumb}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[styles.promoThumb, styles.promoThumbPlaceholder]}
                            />
                          )}
                          <View style={styles.promoBody}>
                            <Text style={styles.promoTitle} numberOfLines={2}>
                              {o.title}
                            </Text>
                            <Text style={styles.promoSub} numberOfLines={1}>
                              Chạm để xem chi tiết ưu đãi.
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.promoRadioWrap}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() =>
                              setSelectedPromotionId((prev) =>
                                prev === o.id ? null : o.id
                              )
                            }
                          >
                            <View
                              style={[
                                styles.promoRadioOuter,
                                on && styles.promoRadioOuterOn,
                              ]}
                            >
                              {on ? <View style={styles.promoRadioInner} /> : null}
                            </View>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
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
                      ...(selectedPromotionId
                        ? {
                            promotionId: selectedPromotionId,
                            promotionTitle:
                              selectedPromotionTitle || undefined,
                          }
                        : {}),
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
                      selectedPromotionTitle
                        ? `Ưu đãi áp dụng: ${selectedPromotionTitle}`
                        : null,
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
    backgroundColor: "#f7577c",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scroll: {
    flex: 1,
  },
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
    fontFamily: "Roboto",
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
    fontFamily: "Roboto",
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
    fontFamily: "Roboto",
    fontSize: responsiveFont(28),
    color: "#f7577c",
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
  ratingHint: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(6),
    lineHeight: responsiveFont(18),
  },
  sectionTitle: {
    fontFamily: "Roboto",
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
    backgroundColor: "#f7577c",
    borderColor: "#f7577c",
  },
  serviceChipText: {
    fontSize: responsiveFont(12),
    color: "#374151",
  },
  serviceChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
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
  promoPickerLabel: {
    fontSize: responsiveFont(13),
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#111827",
  },
  promoPickerHint: {
    fontSize: responsiveFont(11),
    color: "#6b7280",
    lineHeight: responsiveFont(16),
  },
  promoList: {
    marginTop: responsiveHeight(6),
    gap: responsiveHeight(8),
  },
  promoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(10),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: responsiveWidth(8),
    gap: responsiveWidth(10),
  },
  promoRowActive: {
    borderColor: "#f7577c",
    backgroundColor: "#fff5f7",
  },
  promoThumb: {
    width: responsiveWidth(68),
    height: responsiveWidth(68),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#f3f4f6",
  },
  promoThumbPlaceholder: {
    backgroundColor: "#eceff3",
  },
  promoBody: {
    flex: 1,
    minWidth: 0,
  },
  promoRadioWrap: {
    paddingLeft: responsiveWidth(6),
    justifyContent: "center",
    alignItems: "center",
  },
  promoRadioOuter: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(10),
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  promoRadioOuterOn: {
    borderColor: "#f7577c",
  },
  promoRadioInner: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "#f7577c",
  },
  promoTitle: {
    color: "#111827",
    fontFamily: "Roboto",
    fontSize: responsiveFont(13),
    fontWeight: "700",
  },
  promoSub: {
    marginTop: responsiveHeight(4),
    color: "#6b7280",
    fontSize: responsiveFont(11),
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
    backgroundColor: "#f7577c",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Roboto",
    fontSize: responsiveFont(13),
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#f7577c",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  outlineBtnText: {
    color: "#f7577c",
    fontFamily: "Roboto",
    fontSize: responsiveFont(13),
  },
});
