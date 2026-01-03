import React, { useState, useEffect, useRef } from "react";
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
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as Linking from "expo-linking";
import apiClient from "../../api/client";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";
import { updateUserField } from "../../store/authSlice";
import { RootStackParamList } from "../../navigation/types";
import { MixpanelService } from "../../service/mixpanelService";
import logger from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  // useEffect để gọi API lấy trạng thái user khi vào màn hình
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setIsLoadingStatus(true);
        const response = await apiClient.get("/auth/status");
        setCurrentUserAccountType(response.data.accountType);
        MixpanelService.track("Viewed Upgrade Screen", {
          "Current Account Type": response.data.accountType,
        });
      } catch (error) {
        logger.error("Không thể lấy trạng thái tài khoản:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin tài khoản của bạn.");
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchAccountStatus();
  }, []); // Mảng rỗng để chỉ chạy 1 lần khi màn hình được mount

  const url = Linking.useURL();
  const processedUrlRef = useRef<string | null>(null);

  // ✅ Function để fetch lại account status từ backend và cập nhật Redux
  const fetchAccountStatusAfterPayment = async () => {
    try {
      // ⏰ Đợi 2 giây để webhook có thời gian xử lý
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 🔄 Retry mechanism: Thử tối đa 5 lần với delay 2s giữa mỗi lần
      let retryCount = 0;
      const maxRetries = 5;
      let newAccountType = currentUserAccountType;

      while (retryCount < maxRetries) {
        const response = await apiClient.get("/auth/status");
        newAccountType = response.data.accountType;

        // Nếu accountType đã được cập nhật (không còn là FREE), thoát vòng lặp
        if (
          newAccountType !== "FREE" &&
          newAccountType !== currentUserAccountType
        ) {
          break;
        }

        // Nếu chưa update, đợi 2s rồi thử lại
        if (retryCount < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        retryCount++;
      }

      // Cập nhật state local
      setCurrentUserAccountType(newAccountType);

      // ✅ Cập nhật Redux store
      dispatch(
        updateUserField({ field: "accountType", value: newAccountType })
      );
    } catch (error) {
      // Silently fail
    }
  };

  useEffect(() => {
    if (url && url !== processedUrlRef.current) {
      processedUrlRef.current = url;
      const { queryParams } = Linking.parse(url);
      if (queryParams?.status) {
        const status = (queryParams.status as string).toLowerCase();
        const orderCode = queryParams.orderCode as string;
        if (status === "paid" || status === "success") {
          // ✅ Fetch lại account status từ backend và cập nhật Redux
          fetchAccountStatusAfterPayment();

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
  }, [url, dispatch, activeUpgradeTab]);

  const handleUpgrade = async (packageType: string) => {
    setIsProcessing(true);
    let orderDetails = {};
    let price = 0;
    if (packageType === "VIP") {
      price = 59000;
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
      vip: "59.000 đ/tháng",
      pro: "110.000 đ/3 tháng",
      isPrice: true,
      oldVipPrice: "79.000 đ", // Giữ nguyên hoặc xóa tùy logic hiển thị của bạn
      oldProPrice: "139.000 đ", // Giữ nguyên hoặc xóa tùy logic hiển thị của bạn
    },
    {
      label: "Đổi giao diện đếm ngược thời gian",
      free: "Mặc định",
      vip: "Đổi tối đa 7 lần",
      pro: "Không giới hạn số lần đổi",
    },
    {
      label: "Thời hạn Website được công khai",
      free: "3 tháng",
      vip: "12 tháng",
      pro: "Trọn đời",
    },
    {
      label: "Số lượng Album được tạo",
      free: "5",
      vip: "12",
      pro: <Infinity color="#666" size={18} />,
    },
    {
      label: "Loại bỏ quảng cáo",
      free: <X color="#e74c3c" size={20} />,
      vip: <Check color="#2ecc71" size={20} />,
      pro: <Check color="#2ecc71" size={20} />,
    },
    {
      label: "Số lượng thiệp cưới online có thể truy cập",
      free: "3",
      vip: "15",
      pro: "Toàn bộ",
    },
    {
      label: "Tính năng chia sẻ với người hỗ trợ",
      free: "1",
      vip: "5",
      pro: "10",
    },
    {
      label: "Bài đăng kèm ảnh của cộng đồng",
      free: "Giới hạn 2 ảnh và nội dung một bài post",
      vip: "Không giới hạn số lượng ảnh và nội dung trong bài post",
      pro: "Không giới hạn số lượng ảnh, đẩy bài 24h",
    },
    {
      label: "Số lượng ảnh tự up lên trong mỗi album",
      free: "6",
      vip: <Infinity color="#666" size={18} />,
      pro: <Infinity color="#666" size={18} />,
    },
    {
      label: "Ai sẽ là người tiếp theo?",
      free: <X color="#e74c3c" size={20} />,
      vip: <Check color="#2ecc71" size={20} />,
      pro: <Check color="#2ecc71" size={20} />,
    },
    {
      label: "Gợi ý bố trí bàn tiệc",
      free: <X color="#e74c3c" size={20} />,
      vip: <Check color="#2ecc71" size={20} />,
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
          <ActivityIndicator size="large" color="#e07181" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#e07181"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp Tài Khoản</Text>
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
                    <Text style={styles.oldPrice}>{feature.oldVipPrice}</Text>
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
    backgroundColor: "#e07181",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    position: "absolute",
    left: 40,
    right: 40,
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
    backgroundColor: "#e07181",
    borderColor: "#e07181",
  },
  upgradeTabButtonText: {
    fontFamily: "Montserrat-SemiBold",
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
    fontFamily: "Montserrat-SemiBold",
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  tableHeaderCell: {
    fontFamily: "Montserrat-SemiBold",
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
    fontFamily: "Montserrat-Medium",
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
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
    color: "#333",
    textAlign: "center",
  },
  oldPrice: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  price: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    fontWeight: "bold",
    color: "#e07181",
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
    backgroundColor: "#e07181",
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
    fontFamily: "Montserrat-SemiBold",
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
