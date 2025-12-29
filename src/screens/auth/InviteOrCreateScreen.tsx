import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Heart, Plus, Key } from "lucide-react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { setWeddingEventFromCheck } from "../../store/weddingEventSlice";
import { useDispatch } from "react-redux";
import apiClient from "../../api/client"; // <-- Import apiClient
import logger from "../../utils/logger";

export default function InviteOrCreateScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEventStatus = async () => {
      try {
        // Gọi API để kiểm tra
        const response = await apiClient.get("/weddingEvents/check-user");
        const { hasEvent, event } = response.data;

        // Nếu người dùng đã có sự kiện
        if (hasEvent) {
          // console.log("User has an event:", event);
          // 1. Lưu thông tin sự kiện vào Redux
          dispatch(setWeddingEventFromCheck(event));
          // 2. Chuyển hướng thẳng đến màn hình chính
          // Dùng reset để người dùng không thể quay lại màn hình này
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        } else {
          // Nếu không có sự kiện, ẩn loading và hiển thị màn hình
          setIsLoading(false);
        }
      } catch (error) {
        logger.error("Failed to check user event status:", error);
        Alert.alert("Lỗi", "Không thể kiểm tra dữ liệu, vui lòng thử lại.");
        setIsLoading(false); // Ẩn loading dù có lỗi
      }
    };

    checkEventStatus();
  }, [dispatch, navigation]); // <-- Dependency array

  // Hiển thị màn hình loading trong khi đang kiểm tra
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Đang kiểm tra dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fdf2f8"
        translucent={false}
      />

      {/* Background decorative elements */}
      <View style={styles.backgroundDecorations}>
        <View style={[styles.decoration, styles.decoration1]} />
        <View style={[styles.decoration, styles.decoration2]} />
        <View style={[styles.decoration, styles.decoration3]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={32} color="#ec4899" />
            </View>
            <Text style={styles.title}>Hỷ Planner</Text>
            <Text style={styles.subtitle}>
              Tổ chức ngày hoàn hảo của bạn cùng những người thân yêu
            </Text>
          </View>

          {/* Main Action Cards */}
          <View style={styles.cardsContainer}>
            {/* Card để tạo mới, điều hướng đến AddWeddingInfo */}
            <TouchableOpacity
              style={[styles.card, styles.createCard]}
              onPress={() => navigation.navigate("AddWeddingInfo")}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Plus size={24} color="#ec4899" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>
                    Tạo danh sách công việc mới
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Bắt đầu lên kế hoạch cho đám cưới của bạn
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card để tham gia, điều hướng đến JoinWeddingEvent */}
            <TouchableOpacity
              style={[styles.card, styles.joinCard]}
              onPress={() => navigation.navigate("JoinWedding")}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Key size={24} color="#ec4899" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>
                    Tham gia danh sách công việc
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Tham gia vào kế hoạch cưới của người khác
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Giữ nguyên phần styles của bạn ở đây
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  backgroundDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decoration: {
    position: "absolute",
    borderRadius: 100,
  },
  decoration1: {
    top: 80,
    left: 40,
    width: 128,
    height: 128,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
  decoration2: {
    bottom: 128,
    right: 64,
    width: 96,
    height: 96,
    backgroundColor: "rgba(244, 114, 182, 0.15)",
  },
  decoration3: {
    top: "50%",
    right: "25%",
    width: 64,
    height: 64,
    backgroundColor: "rgba(251, 207, 232, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 32,
    color: "#560b4eff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
  },
  createCard: {
    backgroundColor: "rgba(251, 207, 232, 0.8)",
  },
  joinCard: {
    backgroundColor: "rgba(244, 114, 182, 0.6)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdf2f8",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ec4899",
  },
});
