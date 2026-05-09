import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Crown,
  Sparkles,
  Check,
  X,
  Infinity,
  ArrowLeft,
  CheckCircle,
} from "lucide-react-native";
import {
  useNavigation,
  NavigationProp,
  useFocusEffect,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import apiClient from "../../api/client";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";
import { updateUserField } from "../../store/authSlice";
import { RootStackParamList } from "../../navigation/types";
import { MixpanelService } from "../../service/mixpanelService";
import logger from "../../utils/logger";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { normalizeAccountType } from "../../utils/accountLimits";

export default function UpgradeAccountScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  // State để lưu accountType lấy từ API
  const [currentUserAccountType, setCurrentUserAccountType] = useState<
    string | null
  >(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [activeUpgradeTab, setActiveUpgradeTab] = useState("VIP");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const pendingPaymentSyncRef = useRef(false);

  const fetchAccountStatus = useCallback(
    async (opts?: { silent?: boolean; skipLoading?: boolean }) => {
      try {
        if (!opts?.skipLoading) {
          setIsLoadingStatus(true);
        }
        const response = await apiClient.get("/auth/status");
        const accountType = normalizeAccountType(response.data?.accountType);
        setCurrentUserAccountType(accountType);
        dispatch(updateUserField({ field: "accountType", value: accountType }));
        return accountType as string;
      } catch (error) {
        logger.error("Không thể lấy trạng thái tài khoản:", error);
        if (!opts?.silent) {
          Alert.alert("Lỗi", "Không thể tải thông tin tài khoản của bạn.");
        }
        return null;
      } finally {
        if (!opts?.skipLoading) {
          setIsLoadingStatus(false);
        }
      }
    },
    [dispatch]
  );

  // useEffect để gọi API lấy trạng thái user khi vào màn hình
  useEffect(() => {
    fetchAccountStatus().then((accountType) => {
      if (!accountType) return;
      MixpanelService.track("Viewed Upgrade Screen", {
        "Current Account Type": accountType,
      });
    });
  }, [fetchAccountStatus]);

  const url = Linking.useURL();
  const processedUrlRef = useRef<string | null>(null);

  // ✅ Đồng bộ trạng thái gói sau khi thanh toán thành công (đợi webhook backend)
  const syncAccountStatusAfterPayment = async () => {
    try {
      // Đợi chút để backend nhận callback thanh toán
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const maxRetries = 20;
      const delayMs = 1500;
      let latestType = normalizeAccountType(currentUserAccountType);

      for (let i = 0; i < maxRetries; i++) {
        const next = await fetchAccountStatus({ silent: true, skipLoading: true });
        if (next) {
          latestType = normalizeAccountType(next);
        }
        if (latestType === "VIP" || latestType === "PRO") {
          pendingPaymentSyncRef.current = false;
          return latestType;
        }
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      return latestType;
    } catch (error) {
      return currentUserAccountType;
    }
  };

  useFocusEffect(
    useCallback(() => {
      void fetchAccountStatus({ silent: true, skipLoading: true });
      if (pendingPaymentSyncRef.current) {
        void syncAccountStatusAfterPayment();
      }
    }, [fetchAccountStatus])
  );

  useEffect(() => {
    if (url && url !== processedUrlRef.current) {
      processedUrlRef.current = url;
      const { queryParams } = Linking.parse(url);
      if (queryParams?.status) {
        const status = (queryParams.status as string).toLowerCase();
        const orderCode = queryParams.orderCode as string;
        if (status === "paid" || status === "success") {
          pendingPaymentSyncRef.current = true;
          // ✅ Fetch lại account status từ backend và cập nhật Redux
          void syncAccountStatusAfterPayment();

          dispatch(fetchUserInvitation());
          setShowSuccessOverlay(true);
          MixpanelService.track("Viewed Payment Success Screen", {
            "Order Code": orderCode,
            Status: status,
          });
          setTimeout(() => setShowSuccessOverlay(false), 3000);
        } else if (status === "cancelled") {
          Alert.alert("Thông báo", "Giao dịch đã bị hủy.");
          MixpanelService.track("Cancelled Payment", {
            "Order Code": orderCode,
            Method: "Redirect", // Hủy bằng cách quay lại từ PayOS
          });
          if (orderCode) {
            apiClient.post("/payments/cancel-order", { orderCode });
          }
        }
      }
    }
  }, [url, dispatch]);

  const handleUpgrade = async (packageType: string) => {
    setIsProcessing(true);
    let orderDetails = {};
    let price = 0;
    if (packageType === "VIP") {
      price = 79000;
      orderDetails = {
        description: "Nang cap VIP HyPlanner",
        price: price,
        packageType: "VIP",
      };
    } else if (packageType === "PRO") {
      price = 110000;
      orderDetails = {
        description: "Nang cap PRO HyPlanner",
        price: price,
        packageType: "PRO",
      };
    }
    MixpanelService.track("Initiated Payment", {
      "Package Type": packageType,
      Amount: price,
    });
    try {
      const response = await apiClient.post(
        "/payments/create-link",
        orderDetails
      );
      const { checkoutUrl } = response.data;
      if (checkoutUrl) {
        pendingPaymentSyncRef.current = true;
        await Linking.openURL(checkoutUrl);
      }
    } catch (error: any) {
      logger.error("Lỗi khi nâng cấp:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tạo yêu cầu thanh toán vào lúc này."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      label: "Giá",
      free: "Miễn phí",
      vip: "79.000 đ/tháng",
      pro: "110.000 đ/3 tháng",
      isPrice: true,
      oldVipPrice: "",
      oldProPrice: "139.000 đ", // Giữ nguyên hoặc xóa tùy logic hiển thị của bạn
    },
    {
      label: "Lập kế hoạch cưới tổng thể",
      free: "Checklist 11 giai đoạn dựa trên quy trình cưới Việt Nam",
      vip: "Checklist + cảnh báo chậm tiến độ bằng AI và mô phỏng thay đổi kế hoạch",
      pro: "Không giới hạn số lần đổi",
    },
    {
      label: "Vai trò cộng tác",
      free: "Hỷ Partner: quyền tương đương chủ kế hoạch (tối đa 1). Hỷ Assistant: hỗ trợ xem/thêm và sửa dữ liệu do mình tạo (tối đa 1). Hỷ Observer: chỉ theo dõi kế hoạch, không chỉnh sửa (tối đa 1).",
      vip: "Giữ nguyên các vai trò cộng tác như ở gói Free",
      pro: "Trọn đời",
    },
    {
      label: "Theo dõi & kiểm soát ngân sách",
      free: "Theo dõi chi tiêu theo từng hạng mục",
      vip: "Phân tích chênh lệch ngân sách, cảnh báo vượt chi và gợi ý điều chỉnh",
      pro: <Infinity color="#666" size={18} />,
    },
    {
      label: "Quản lý khách mời & RSVP",
      free: "Tạo danh sách khách mời và theo dõi RSVP",
      vip: "Gợi ý sắp xếp số bàn dựa trên dữ liệu RSVP; theo dõi quà mừng và quà đáp lễ",
      pro: <Check color="#2ecc71" size={20} />,
    },
    {
      label: "Tìm kiếm & lựa chọn vendor",
      free: "Tìm kiếm, lọc và chọn vendor",
      vip: "Đề xuất vendor bằng AI; chat trực tiếp với vendor",
      pro: "Toàn bộ",
    },
    {
      label: "Thiệp cưới & giao tiếp với khách",
      free: "Thiệp cưới/website cưới online dùng template có sẵn",
      vip: "Nội dung thiệp/website được AI cá nhân hóa và chia sẻ linh hoạt hơn",
      pro: "10",
    },
    {
      label: "Định hình & lưu trữ phong cách",
      free: "Tối đa 5 album",
      vip: "Tối đa 12 album",
      pro: "Không giới hạn số lượng ảnh, đẩy bài 24h",
    },
    {
      label: "Chia sẻ trải nghiệm cộng đồng",
      free: "Giới hạn số bài đăng và hình ảnh",
      vip: "Không giới hạn nội dung, bao gồm cả video",
      pro: <Infinity color="#666" size={18} />,
    },
    {
      label: "Tương tác trong ngày cưới",
      free: "Không có",
      vip: "Mini-game tương tác",
      pro: <Check color="#2ecc71" size={20} />,
    },
    // {
    //   label: "Import/Export file sheet quản lý khách mời",
    //   free: <X color="#e74c3c" size={20} />,
    //   vip: <Check color="#2ecc71" size={20} />,
    //   pro: <Check color="#2ecc71" size={20} />,
    // },
    // {
    //   label: "Notification",
    //   free: <X color="#e74c3c" size={20} />,
    //   vip: <Check color="#2ecc71" size={20} />,
    //   pro: <Check color="#2ecc71" size={20} />,
    // },
    // {
    //   label: "Chia sẻ kế hoạch cho gia đình (quyền xem/chỉnh sửa)",
    //   free: <X color="#e74c3c" size={20} />,
    //   vip: <X color="#e74c3c" size={20} />,
    //   pro: <Check color="#2ecc71" size={20} />,
    // },
    // {
    //   label: "Hộp mừng cưới",
    //   free: <X color="#e74c3c" size={20} />,
    //   vip: <X color="#e74c3c" size={20} />, // Trong ảnh cột VIP là dấu X
    //   pro: <Check color="#2ecc71" size={20} />,
    // },
  ];

  const renderFeatureCell = (content: React.ReactNode) => {
    if (React.isValidElement(content)) {
      return content;
    }
    return <Text style={styles.featureCellText}>{content}</Text>;
  };

  const selectedPackagePrice =
    activeUpgradeTab === "VIP" ? features[0].vip : features[0].pro;

  const isVipTabDisabled =
    currentUserAccountType === "VIP" || currentUserAccountType === "PRO";
  const isProTabDisabled = currentUserAccountType === "PRO";

  let isUpgradeButtonDisabled = false;
  let upgradeButtonText = `Nâng cấp ${activeUpgradeTab}: ${selectedPackagePrice}`;

  if (currentUserAccountType === "PRO") {
    isUpgradeButtonDisabled = true;
    upgradeButtonText = "Bạn đã là tài khoản PRO";
  } else if (currentUserAccountType === "VIP" && activeUpgradeTab === "VIP") {
    isUpgradeButtonDisabled = true;
    upgradeButtonText = "Bạn đã là tài khoản VIP";
  }

  // Nếu đang tải trạng thái, hiển thị màn hình loading
  if (isLoadingStatus) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#f7577c" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#f7577c"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Nâng cấp Tài Khoản
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.upgradeTabsContainer}>
        <TouchableOpacity
          style={[
            styles.upgradeTabButton,
            activeUpgradeTab === "VIP" && styles.activeUpgradeTabButton,
            isVipTabDisabled && styles.buttonDisabled,
          ]}
          onPress={() => {
            setActiveUpgradeTab("VIP");
            MixpanelService.track("Switched Upgrade Tab", {
              "Tab Selected": "VIP",
            });
          }}
          disabled={isVipTabDisabled}
        >
          <Crown
            size={16}
            color={activeUpgradeTab === "VIP" ? "#fff" : "#f1c40f"}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.upgradeTabButtonText,
              activeUpgradeTab === "VIP" && styles.activeUpgradeTabButtonText,
            ]}
          >
            Nâng cấp VIP
          </Text>
        </TouchableOpacity>
        {/* TEMPORARY: PRO package disabled by client request
        <TouchableOpacity
          style={[
            styles.upgradeTabButton,
            activeUpgradeTab === "PRO" && styles.activeUpgradeTabButton,
            isProTabDisabled && styles.buttonDisabled,
          ]}
          onPress={() => {
            setActiveUpgradeTab("PRO");
            MixpanelService.track("Switched Upgrade Tab", {
              "Tab Selected": "PRO",
            });
          }}
          disabled={isProTabDisabled}
        >
          <Sparkles
            size={16}
            color={activeUpgradeTab === "PRO" ? "#fff" : "#3498db"}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.upgradeTabButtonText,
              activeUpgradeTab === "PRO" && styles.activeUpgradeTabButtonText,
            ]}
          >
            Nâng cấp PRO
          </Text>
        </TouchableOpacity>
        */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCellLabel}></Text>
            <View style={styles.verticalSeparator} />
            <Text style={styles.tableHeaderCell}>FREE</Text>
            <View style={styles.verticalSeparator} />
            <Text style={styles.tableHeaderCell}>VIP</Text>
            {/* TEMPORARY: PRO column hidden
            <View style={styles.verticalSeparator} />
            <Text style={styles.tableHeaderCell}>PRO</Text>
            */}
          </View>

          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            >
              <Text style={styles.featureLabelText}>{feature.label}</Text>
              <View style={styles.verticalSeparator} />
              <View style={styles.featureCell}>
                {renderFeatureCell(feature.free)}
              </View>
              <View style={styles.verticalSeparator} />
              <View style={styles.featureCell}>
                {feature.isPrice ? (
                  <>
                    {feature.oldVipPrice ? (
                      <Text style={styles.oldPrice}>{feature.oldVipPrice}</Text>
                    ) : null}
                    <Text style={styles.price}>{feature.vip}</Text>
                  </>
                ) : (
                  renderFeatureCell(feature.vip)
                )}
              </View>
              {/* TEMPORARY: PRO column hidden
              <View style={styles.verticalSeparator} />
              <View style={styles.featureCell}>
                {feature.isPrice ? (
                  <>
                    <Text style={styles.oldPrice}>{feature.oldProPrice}</Text>
                    <Text style={styles.price}>{feature.pro}</Text>
                  </>
                ) : (
                  renderFeatureCell(feature.pro)
                )}
              </View>
              */}
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomButtonContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.upgradeButton,
            (isProcessing || isUpgradeButtonDisabled) && styles.buttonDisabled,
          ]}
          onPress={() => handleUpgrade(activeUpgradeTab)}
          disabled={isProcessing || isUpgradeButtonDisabled}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.upgradeButtonText}>{upgradeButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>

      {showSuccessOverlay && (
        <View style={styles.overlay}>
          <View style={styles.successBox}>
            <CheckCircle size={60} color="#2ecc71" />
            <Text style={styles.successTitle}>Nâng cấp thành công!</Text>
            <Text style={styles.successSubtitle}>
              Tài khoản của bạn đã được cập nhật.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    backgroundColor: "#f7577c",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    textAlign: "center",
  },
  upgradeTabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  upgradeTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeUpgradeTabButton: {
    backgroundColor: "#f7577c",
    borderColor: "#f7577c",
  },
  upgradeTabButtonText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#555",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeUpgradeTabButtonText: {
    color: "#fff",
  },
  container: {
    paddingHorizontal: 10,
    paddingBottom: 100, // Tăng padding để không bị nút che mất
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
  },
  tableHeaderCellLabel: {
    fontFamily: "Roboto",
    fontWeight: "600",
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  tableHeaderCell: {
    fontFamily: "Roboto",
    fontWeight: "600",
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
  evenRow: {
    backgroundColor: "#fff",
  },
  oddRow: {
    backgroundColor: "#fdfdfd",
  },
  featureLabelText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#555",
  },
  featureCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCellText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 13,
    color: "#333",
    textAlign: "center",
  },
  oldPrice: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  price: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 14,
    fontWeight: "bold",
    color: "#f7577c",
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  upgradeButton: {
    backgroundColor: "#f7577c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
    borderColor: "#cccccc",
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    width: "75%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
