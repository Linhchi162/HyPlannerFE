import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { ChevronLeft, Package, User, LogOut, Crown } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import { logoutVendor } from "../../service/vendorAuthService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import { auth } from "../../service/firebase";
import {
  activateVendorPriority,
  subscribeVendorProfile,
  Vendor,
} from "../../service/vendorService";

export default function VendorDashboardScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentUser = useSelector(selectCurrentUser);
  const vendorId =
    auth.currentUser?.uid ||
    currentUser?.id ||
    currentUser?._id ||
    currentUser?.uid || "";
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    const unsub = subscribeVendorProfile(vendorId, setVendorProfile);
    return () => unsub();
  }, [vendorId]);

  const isFeatured = vendorProfile?.isFeatured === true;

  const handleRegisterPriority = async () => {
    if (!vendorId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin nhà cung cấp.");
      return;
    }
    if (!vendorProfile) {
      Alert.alert(
        "Lỗi",
        "Chưa có hồ sơ nhà cung cấp. Vui lòng cập nhật hồ sơ trước."
      );
      return;
    }
    try {
      await activateVendorPriority(vendorId, 50000);
      Alert.alert("Đăng ký thành công", "Bạn đã đăng ký gói ưu tiên hiển thị.");
    } catch {
      Alert.alert("Lỗi", "Không thể đăng ký gói ưu tiên. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Kênh nhà cung cấp
          </Text>
        </View>
        <TouchableOpacity onPress={logoutVendor}>
          <LogOut size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hồ sơ doanh nghiệp</Text>
          <Text style={styles.cardSub}>
            Cập nhật thông tin, ảnh đại diện và khu vực hoạt động.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("VendorProfileEdit")}
          >
            <User size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dịch vụ & gói</Text>
          <Text style={styles.cardSub}>
            Tạo mới, chỉnh sửa gói dịch vụ và bảng giá.
          </Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate("VendorServices")}
          >
            <Package size={18} color="#ff5a7a" />
            <Text style={styles.outlineBtnText}>Quản lý dịch vụ</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.featuredCard]}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredPrice}>50.000 VND / tháng</Text>
          </View>
          <Text style={styles.cardTitle}>Ưu tiên hiển thị</Text>
          <Text style={styles.cardSub}>
            Nhà cung cấp được đẩy lên đầu danh sách và gắn nhãn đề xuất.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isFeatured && styles.primaryBtnDisabled,
            ]}
            onPress={handleRegisterPriority}
            disabled={isFeatured}
          >
            <Crown size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>
              {isFeatured ? "Đã đăng ký" : "Đăng ký gói ưu tiên"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    color: "#ffffff",
    fontFamily: "MavenPro",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(12),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  featuredCard: {
    borderColor: "#ffd1da",
    backgroundColor: "#fff5f7",
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(8),
  },
  featuredPrice: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#be123c",
  },
  cardTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#111827",
  },
  cardSub: {
    marginTop: responsiveHeight(6),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  primaryBtn: {
    marginTop: responsiveHeight(12),
    backgroundColor: "#ff5a7a",
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  primaryBtnDisabled: {
    backgroundColor: "#fda4af",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
  outlineBtn: {
    marginTop: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#ff5a7a",
    paddingVertical: responsiveHeight(10),
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
