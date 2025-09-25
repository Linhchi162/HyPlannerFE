import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { ChevronRight, List, Shirt, Mail, Wallet } from "lucide-react-native";
import { useState } from "react";
import { getWeddingEvent } from "../service/weddingEventService";
import { AppDispatch, RootState } from "../store";

const { width, height } = Dimensions.get("window");

const weddingImages = [
  {
    uri: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=500&fit=crop",
    caption: "Váy cưới vintage",
  },
  {
    uri: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop",
    caption: "Hoa cưới lãng mạn",
  },
  {
    uri: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=500&fit=crop",
    caption: "Nhẫn cưới đẹp",
  },
  {
    uri: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop",
    caption: "Tiệc cưới sang trọng",
  },
  {
    uri: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=500&fit=crop",
    caption: "Trang trí cưới",
  },
];

const HomeScreen = () => {
  const user = useSelector(selectCurrentUser);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.round(scrollPosition / width);
    setCurrentImageIndex(imageIndex);
  };
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchWeddingInfo = async () => {
      if (!user) return;
      try {
        await getWeddingEvent(user.id || user._id, dispatch);
      } catch (error) {
        console.error("Error fetching wedding info:", error);
      }
    };
    fetchWeddingInfo();
  }, [dispatch]);
  const creatorId = useSelector(
    (state: RootState) =>
      state.weddingEvent.getWeddingEvent.weddingEvent.creatorId
  );
  const eventId = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent._id
  );
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
              }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>Xin chào, Hau & Nhu</Text>
          <Text style={styles.greetingText}>
            Đếm ngược ngày cưới còn 62 ngày.{"\n"}
            Hãy thiết kế đám cưới của riêng bạn ngay bây giờ!
          </Text>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>62</Text>
            <Text style={styles.countdownLabel}>ngày</Text>
          </View>
        </View>

        {/* Wedding Image Carousel */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.carouselContainer}
          >
            {weddingImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.weddingImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          <Text style={styles.imageCaption}>
            {weddingImages[currentImageIndex].caption}
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              navigation.navigate("TaskList", { eventId: eventId })
            }
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <List size={16} color="white" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Danh sách của bạn</Text>
                <Text style={styles.menuSubtitle}>Danh sách công việc</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
          {/* chỉ cho creator */}
          {(user.id || user._id) === creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("BudgetList")}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Wallet size={16} color="white" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Ngân sách của bạn</Text>
                  <Text style={styles.menuSubtitle}>Danh sách ngân sách</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Shirt size={16} color="white" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Tủ đồ & Phong cách</Text>
                <Text style={styles.menuSubtitle}>Lựa chọn trang phục</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Mail size={16} color="white" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Thiệp mời Online</Text>
                <Text style={styles.menuSubtitle}>Tạo thiệp mời điện tử</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Bottom padding to account for bottom navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e91e63",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  greetingCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#ffe4e8",
    borderRadius: 16,
    padding: 24,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 12,
  },
  greetingText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ff6b9d",
  },
  countdownLabel: {
    color: "#6b7280",
    fontSize: 14,
  },
  imageSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  carouselContainer: {
    marginHorizontal: -16, // Offset parent margin to make full width
  },
  imageContainer: {
    width: width - 32, // Account for parent margins
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  weddingImage: {
    width: "100%",
    height: width * 0.8, // Responsive height based on screen width
  },
  imageCaption: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 16,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#ff6b9d",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    gap: 2,
  },
  menuTitle: {
    fontWeight: "500",
    color: "#1f2937",
    fontSize: 16,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomPadding: {
    height: 55, // Space for bottom navigation
  },
});

export default HomeScreen;
