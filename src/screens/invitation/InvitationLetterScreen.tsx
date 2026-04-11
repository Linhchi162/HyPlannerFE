import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ChevronLeft, Crown, Sparkles, Palette } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { NavigationProp, useNavigation } from "@react-navigation/core";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import apiClient from "../../api/client";
// import invitationClient from "../../api/invitationClient";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";

const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#374151",
  textSecondary: "#6D6D6D",
  primary: "#ff5a7a",
  accent: "#e07181",
  white: "#FFFFFF",
};

export type Template = {
  id: number;
  name: string;
  type: string;
  image: string;
};

export default function InvitationLetterScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const currentUser = useSelector(selectCurrentUser);
  const userAccountType = String(currentUser?.accountType || "FREE").toUpperCase();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get("/templates");
        setTemplates(response.data);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách mẫu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const firstTemplate = templates.length > 0 ? templates[0] : null;

  const handleUseFreeTemplate = () => {
    if (!firstTemplate) return;
    navigation.navigate("CreateWeddingSite", { template: firstTemplate });
  };

  const handleUseAITemplate = () => {
    // if (userAccountType === "FREE") {
    //   Alert.alert(
    //       "Nâng cấp tài khoản",
    //       "Tính năng tạo thiệp bằng AI chỉ dành cho tài khoản VIP. Vui lòng nâng cấp tài khoản để sử dụng.",
    //       [
    //         { text: "Hủy", style: "cancel" },
    //         {
    //           text: "Nâng cấp ngay",
    //           onPress: () => {
    //             navigation.navigate("UpgradeAccountScreen");
    //           },
    //         },
    //       ]
    //   );
    //   return;
    // }

    if (!firstTemplate) return;
    // @ts-ignore
    navigation.navigate("CreateWeddingSite", { template: firstTemplate, useAI: true });
  };

  if (isLoading) {
    return (
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Đang tải thông tin...
          </Text>
        </SafeAreaView>
    );
  }

  if (error) {
    return (
        <SafeAreaView style={styles.centerContainer}>
          <Text style={{ color: "red" }}>Lỗi: {error}</Text>
          <Text>Vui lòng thử lại sau.</Text>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.primary}
            translucent={false}
        />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={pinkHeaderStyles.titleContainer}>
            <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
              Chọn Mẫu Thiệp Cưới
            </Text>
          </View>
          <View style={{ width: responsiveWidth(24) }} />
        </View>

        <View style={styles.contentContainer}>
          {/* Free Template Option */}
          <View style={styles.optionCard}>
            <View style={styles.imageContainer}>
              {firstTemplate ? (
                  <Image
                      source={{ uri: firstTemplate.image }}
                      style={styles.cardImage}
                      resizeMode="cover"
                  />
              ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Palette size={48} color="#ccc" />
                  </View>
              )}
              <View style={styles.badgeContainer}>
                <Text style={[styles.badgeText, styles.freeBadge]}>Miễn phí</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Mẫu thiệp cơ bản</Text>
              <Text style={styles.cardDescription}>
                Sử dụng mẫu thiệp cưới có sẵn đẹp mắt và tiện lợi.
              </Text>
              <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleUseFreeTemplate}
                  disabled={!firstTemplate}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Sử dụng mẫu thiệp cưới
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Template Option */}
          <View style={styles.optionCard}>
            <View style={[styles.imageContainer, styles.aiImageContainer]}>
              <Sparkles size={64} color={COLORS.primary} />
              <View style={styles.badgeContainer}>
                <Text style={[styles.badgeText, styles.vipBadge]}>VIP</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Thiệp cưới AI</Text>
              <Text style={styles.cardDescription}>
                Tạo thiệp cưới độc đáo với công nghệ AI tiên tiến.
              </Text>
              <TouchableOpacity
                  style={[styles.button, styles.vipButton]}
                  onPress={handleUseAITemplate}
              >
                <View style={styles.vipButtonContent}>
                  <Crown size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    Tạo thiệp cưới bằng AI
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
    height: responsiveHeight(56),
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "700",
    fontSize: responsiveFont(20),
    fontWeight: "700",
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    padding: responsiveWidth(16),
    gap: responsiveHeight(20),
    justifyContent: "center", // Center cards vertically
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  imageContainer: {
    height: responsiveHeight(180),
    width: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  aiImageContainer: {
    backgroundColor: "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  badgeText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    overflow: "hidden",
  },
  freeBadge: {
    backgroundColor: "#366d4a",
  },
  vipBadge: {
    backgroundColor: COLORS.primary,
  },
  cardContent: {
    padding: responsiveWidth(16),
  },
  cardTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(18),
    color: COLORS.textPrimary,
    marginBottom: responsiveHeight(4),
  },
  cardDescription: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(14),
    color: COLORS.textSecondary,
    marginBottom: responsiveHeight(16),
  },
  button: {
    paddingVertical: responsiveHeight(12),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  vipButton: {
    backgroundColor: "#9333ea", // Purple for VIP/AI
  },
  buttonText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(14),
    fontWeight: "600",
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  vipButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
