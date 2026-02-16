import React, { useState } from "react";
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
  StatusBar,
} from "react-native";
import { ChevronLeft, Send } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { submitVendorApplication } from "../../service/vendorService";

export default function VendorOnboardingScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !category.trim() || !location.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setSubmitting(true);
      await submitVendorApplication({
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
      });
      Alert.alert("Đã gửi", "Thông tin đã được lưu trên Firebase.");
      navigation.goBack();
    } catch {
      Alert.alert("Lỗi", "Không thể gửi thông tin, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#ff5a7a"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký nhà cung cấp</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tên nhà cung cấp</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Studio Ánh Dương"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Danh mục dịch vụ</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Chụp ảnh / Makeup / Nhà hàng..."
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Khu vực hoạt động</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="TP.HCM / Hà Nội..."
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Send size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Gửi đăng ký</Text>
            </>
          )}
        </TouchableOpacity>
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
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
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
});
