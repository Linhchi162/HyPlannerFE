// screens/CreateWeddingSiteScreen.js

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from "react-native";

// shared color palette
const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#374151",
  textSecondary: "#6D6D6D",
  primary: "#ff5a7a",
  accent: "#e07181",
  white: "#FFFFFF",
  error: "#e74c3c",
};

import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";

import { ChevronLeft } from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import slugify from "slugify";
import invitationClient from "../../api/invitationClient";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";

type CreateWeddingSiteRouteProp = RouteProp<
  RootStackParamList,
  "CreateWeddingSite"
>;

export default function CreateWeddingSiteScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<CreateWeddingSiteRouteProp>();
  const { template } = route.params; // Nhận template từ màn hình trước
  const dispatch = useAppDispatch();

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("31/05/2025");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const invitationBaseUrl =
    process.env.EXPO_PUBLIC_INVITATION_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    "https://hy-planner-be.vercel.app";
  const invitationHost = invitationBaseUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  // Tự động tạo slug khi tên cô dâu, chú rể thay đổi
  useEffect(() => {
    if (groomName && brideName) {
      const combinedNames = `${groomName} and ${brideName}`;
      setSlug(slugify(combinedNames, { lower: true, strict: true }));
    } else {
      setSlug("");
    }
  }, [groomName, brideName]);

  const handleCreateWebsite = async () => {
    if (!groomName || !brideName || !slug) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }
    setIsLoading(true);

    try {
      const response = await invitationClient.post("/invitation/invitation-letters", {
        templateId: template.id,
        groomName,
        brideName,
        weddingDate,
        slug,
      });
      const result = response.data;
      dispatch(fetchUserInvitation());

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: "WebsiteTab",
            },
          },
        ],
      });
    } catch (error: any) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as any).message)
          : "Không thể tạo website";
      Alert.alert(
        "Không thể tạo thiệp online",
        `${message}\n\nNếu BE deploy đang tắt tính năng tạo thiệp, bạn có thể trỏ sang BE khác bằng cách set EXPO_PUBLIC_INVITATION_BASE_URL trong HyPlannerFE/.env rồi chạy lại Expo.`
      );
    } finally {
      setIsLoading(false); // <-- Thêm dòng này để dừng loading sau khi navigate
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Main", { screen: "Home" })}
        >
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Tạo Mới Website Đám Cưới
          </Text>
        </View>
        <View style={{ width: responsiveWidth(24) }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Preview Template */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: template.image }} style={styles.previewImage} />
        </View>

        {/* Form Inputs */}
        <Text style={styles.label}>Tên chú rể*</Text>
        <TextInput
          style={styles.input}
          value={groomName}
          onChangeText={setGroomName}
          placeholder="Nhập tên chú rể"
        />

        <Text style={styles.label}>Tên cô dâu*</Text>
        <TextInput
          style={styles.input}
          value={brideName}
          onChangeText={setBrideName}
          placeholder="Nhập tên cô dâu"
        />

        <Text style={styles.label}>Ngày tổ chức đám cưới*</Text>
        <TextInput
          style={styles.input}
          value={weddingDate}
          onChangeText={setWeddingDate}
          placeholder="DD/MM/YYYY"
        />

        <Text style={styles.label}>Địa chỉ website*</Text>
        <View style={styles.slugInputContainer}>
          <Text style={styles.slugPrefix}>
            {invitationHost}/inviletter/
          </Text>
          <TextInput
            style={styles.slugInput}
            value={slug}
            onChangeText={setSlug}
            placeholder="ten-chu-re-va-co-dau"
            autoCapitalize="none"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateWebsite}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Đang tạo..." : "Tạo Website"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Thêm style cho màn hình mới
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro-Bold",
    fontSize: responsiveFont(20),
    fontWeight: "700",
    color: COLORS.white,
  },
  container: { padding: responsiveWidth(20) },
  previewContainer: {
    marginBottom: responsiveHeight(24),
    borderRadius: responsiveWidth(16),
    overflow: "hidden",
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  previewImage: { width: "100%", height: responsiveHeight(200), resizeMode: "cover" },
  label: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: COLORS.textPrimary,
    marginBottom: responsiveHeight(8),
  },
  input: {
    fontFamily: "Montserrat-Medium",
    backgroundColor: COLORS.card,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(8),
    fontSize: responsiveFont(16),
    marginBottom: responsiveHeight(16),
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  slugInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: responsiveWidth(8),
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  slugPrefix: {
    fontFamily: "Montserrat-Medium",
    paddingLeft: responsiveWidth(16),
    fontSize: responsiveFont(16),
    color: "#6B7280",
  },
  slugInput: {
    fontFamily: "Montserrat-Medium",
    flex: 1,
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(8),
    fontSize: responsiveFont(16),
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: responsiveHeight(16),
    borderRadius: responsiveWidth(8),
    alignItems: "center",
    marginTop: responsiveHeight(24),
  },
  buttonDisabled: {
    backgroundColor: "#F9A8B4",
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.white,
    fontSize: responsiveFont(18),
    fontWeight: "600",
  },
});
