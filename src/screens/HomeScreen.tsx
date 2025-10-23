import React, { useEffect, useState, useMemo } from "react";
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
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types"; // Đảm bảo đường dẫn này đúng
import { ChevronRight, List, Shirt, Mail, Wallet, LifeBuoy } from "lucide-react-native";
import { getWeddingEvent } from "../service/weddingEventService";
import { AppDispatch, RootState } from "../store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive"; // Đảm bảo đường dẫn này đúng

const { width } = Dimensions.get("window");

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
    uri: "https://tuandiamond.vn/wp-content/uploads/2024/08/nhan-cuoi-kim-cuong-tu-nhien-cao-cap-nc1489.jpg",
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
  // --- LẤY DỮ LIỆU TỪ REDUX STORE ---
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const { weddingEvent, isLoading, error } = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent
  );
  const eventId = weddingEvent?._id;
  const member = weddingEvent?.member || [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchWeddingInfo = async () => {
      const userId = user?.id || user?._id;
      if (userId) {
        try {
          await getWeddingEvent(userId, dispatch);
        } catch (err) {
          console.error("Error fetching wedding info:", err);
        }
      }
    };
    fetchWeddingInfo();
  }, [dispatch, user]);

  // --- TÍNH TOÁN SỐ NGÀY ĐẾM NGƯỢC ĐỘNG ---
  const daysLeft = useMemo(() => {
    if (!weddingEvent?.timeToMarried) {
      return 0;
    }
    const weddingDate = new Date(weddingEvent.timeToMarried);
    const today = new Date();
    weddingDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const differenceInTime = weddingDate.getTime() - today.getTime();
    if (differenceInTime < 0) {
      return 0;
    }
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  }, [weddingEvent?.timeToMarried]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.round(scrollPosition / width);
    setCurrentImageIndex(imageIndex);
  };

  // --- XỬ LÝ CÁC TRẠNG THÁI UI ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#ff6b9d" />
        <Text style={styles.centerText}>Đang tải dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.centerText}>Đã có lỗi xảy ra khi tải dữ liệu.</Text>
      </SafeAreaView>
    );
  }

  if (!weddingEvent) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.centerText}>Chào {user?.fullName}!</Text>
        <Text style={styles.centerText}>Bạn chưa tạo sự kiện cưới nào.</Text>
        <TouchableOpacity
          style={styles.createEventButton}
          onPress={() => navigation.navigate("AddWeddingInfo")}
        >
          <Text style={styles.createEventButtonText}>
            Tạo kế hoạch cưới ngay
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- GIAO DIỆN CHÍNH KHI CÓ DỮ LIỆU ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            insets.bottom > 0 ? insets.bottom : responsiveHeight(20),
        }}
      >
        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>
            {`Chúc mừng, ${weddingEvent.groomName} & ${weddingEvent.brideName}`}
          </Text>
          <Text style={styles.greetingText}>
            Hãy thiết kế đám cưới của riêng bạn ngay bây giờ!{"\n"}
            Đếm ngược ngày cưới còn lại:
          </Text>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{daysLeft}</Text>
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
            onPress={() => {
              if (eventId) {
                navigation.navigate("TaskList", { eventId: eventId });
              }
            }}
            disabled={!eventId}
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

          {(user?.id || user?._id) === weddingEvent.creatorId && (
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("ChooseStyle")}
          >
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("InvitationLettersScreen")}
          >
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
          {(user?.id || user?._id) === weddingEvent.creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("WhoIsNextMarried", { member, creatorId: weddingEvent.creatorId })}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <LifeBuoy size={16} color="white" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Ai là người tiếp theo kết hôn?</Text>
                  <Text style={styles.menuSubtitle}>Xem ai là người tiếp theo</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

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
  greetingCard: {
    marginHorizontal: responsiveWidth(16),
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(24),
    backgroundColor: "#ffe4e8",
    borderRadius: responsiveWidth(16),
    padding: responsiveWidth(24),
  },
  greetingTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: responsiveHeight(12),
  },
  greetingText: {
    fontFamily: "Montserrat-Medium",
    color: "#6b7280",
    fontSize: responsiveFont(14),
    lineHeight: responsiveHeight(20),
    marginBottom: responsiveHeight(24),
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  countdownNumber: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(36),
    fontWeight: "bold",
    color: "#ff6b9d",
  },
  countdownLabel: {
    fontFamily: "Montserrat-Medium",
    color: "#6b7280",
    fontSize: responsiveFont(24),
  },
  imageSection: {
    marginBottom: responsiveHeight(16),
  },
  carouselContainer: {
    // Để trống vì nó đã tự động theo chiều rộng màn hình
  },
  imageContainer: {
    width: width - responsiveWidth(32), // Chiều rộng màn hình trừ đi lề 2 bên
    marginHorizontal: responsiveWidth(16),
    borderRadius: responsiveWidth(16),
    overflow: "hidden",
    marginBottom: responsiveHeight(12),
  },
  weddingImage: {
    width: "100%",
    height: (width - responsiveWidth(32)) * 0.8, // Giữ tỷ lệ ảnh responsive
  },
  imageCaption: {
    fontFamily: "Montserrat-Medium",
    textAlign: "center",
    color: "#6b7280",
    fontSize: responsiveFont(14),
    marginBottom: responsiveHeight(16),
  },
  menuSection: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(32),
    gap: responsiveHeight(4),
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
  },
  menuIcon: {
    width: responsiveWidth(32),
    height: responsiveWidth(32), // Giữ hình vuông
    backgroundColor: "#ff6b9d",
    borderRadius: responsiveWidth(8),
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    gap: responsiveHeight(2),
  },
  menuTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "500",
    color: "#1f2937",
    fontSize: responsiveFont(16),
  },
  menuSubtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  bottomPadding: {
    height: responsiveHeight(85), // Không gian cho thanh điều hướng dưới cùng
  },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: responsiveWidth(16),
  },
  centerText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(16),
    color: "#6b7280",
    textAlign: "center",
    marginBottom: responsiveHeight(16),
  },
  createEventButton: {
    backgroundColor: "#ff6b9d",
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(24),
    borderRadius: responsiveWidth(8),
  },
  createEventButtonText: {
    fontFamily: "Montserrat-SemiBold",
    color: "white",
    fontSize: responsiveFont(16),
  },
});

export default HomeScreen;
