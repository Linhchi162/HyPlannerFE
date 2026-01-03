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
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUserField } from "../../store/authSlice";
import { getAccountLimits, getUpgradeMessage } from "../../utils/accountLimits";
import apiClient from "../../api/client";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types"; // Đảm bảo đường dẫn này đúng
import {
  ChevronRight,
  List,
  Shirt,
  Mail,
  Wallet,
  LifeBuoy,
  Users,
  Heart,
  MessageCircle,
  Bell,
  CheckSquare,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import { getWeddingEvent } from "../../service/weddingEventService";
import { AppDispatch, RootState } from "../../store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelService } from "../../service/mixpanelService";

import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive"; // Đảm bảo đường dẫn này đúng

const { width } = Dimensions.get("window");

const weddingImages = [
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667227/9_mpexd8.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667221/8_twob09.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667216/7_ff4esl.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667210/6_vdxezp.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667204/5_e5n5n2.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667199/4_usqqek.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667193/3_g7ynch.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667188/2_shfqfm.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667182/13_hfsuim.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667176/12_bsrzrf.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667171/10_sjvfve.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667165/11_skvxvv.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667160/14_z9rmd1.jpg",
    caption: "",
  },
  {
    uri: "https://res.cloudinary.com/dqtemoeoz/image/upload/v1766667154/1_j0brfb.jpg",
    caption: "",
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
  const [randomImages, setRandomImages] = useState<typeof weddingImages>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollAnimation = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  // Animation cho trái tim
  const [heartScale] = useState(new Animated.Value(1));
  const [heartOpacity] = useState(new Animated.Value(1));

  // Countdown state (theo giây)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  useEffect(() => {
    MixpanelService.track("Viewed Dashboard");

    // Random chọn 7 ảnh từ weddingImages
    const shuffled = [...weddingImages].sort(() => Math.random() - 0.5);
    setRandomImages(shuffled.slice(0, 7));

    // ✅ Force refresh accountType từ backend khi vào HomeScreen
    const refreshAccountType = async () => {
      try {
        const response = await apiClient.get("/auth/status");
        const currentAccountType = response.data.accountType;

        // Cập nhật Redux store nếu khác
        if (user?.accountType !== currentAccountType) {
          dispatch(
            updateUserField({ field: "accountType", value: currentAccountType })
          );
        }
      } catch (error) {
        // Silently fail
      }
    };

    refreshAccountType();
  }, [dispatch]);

  // ❌ REMOVED: Duplicate API call - data now fetched centrally in App.tsx via useAppInitialization
  // useEffect(() => {
  //   const fetchWeddingInfo = async () => {
  //     const userId = user?.id || user?._id;
  //     if (userId) {
  //       try {
  //         await getWeddingEvent(userId, dispatch);
  //       } catch (err) {
  //         console.error("Error fetching wedding info:", err);
  //       }
  //     }
  //   };
  //   fetchWeddingInfo();
  // }, [dispatch, user]);

  // Tính toán countdown theo giây và update mỗi giây
  // ✅ OPTIMIZED: Chỉ update khi seconds thay đổi
  useEffect(() => {
    if (!weddingEvent?.timeToMarried) {
      return;
    }

    const calculateTimeLeft = () => {
      const weddingDate = new Date(weddingEvent.timeToMarried);
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
        });
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      // ✅ CHỈ UPDATE KHI SECONDS THAY ĐỔI (tránh re-render không cần thiết)
      setTimeLeft((prev) => {
        if (prev.seconds !== seconds) {
          return { days, hours, minutes, seconds, totalSeconds };
        }
        return prev;
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [weddingEvent?.timeToMarried]);

  // Hiệu ứng animation cho trái tim (nhấp nháy)
  // ✅ OPTIMIZED: Sử dụng useRef để tránh recreation của Animated.Value
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(heartOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(heartOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []); // ✅ FIXED: Empty deps array - animation chỉ start 1 lần

  // Auto-scroll carousel với transition mượt mà
  useEffect(() => {
    if (randomImages.length === 0) return;

    const autoScrollInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % randomImages.length;
        const targetX = nextIndex * width;

        // Sử dụng Animated.timing để có transition mượt mà hơn
        Animated.timing(scrollAnimation, {
          toValue: targetX,
          duration: 2000, // ← Transition mượt mà trong 2 giây
          useNativeDriver: false,
        }).start(() => {
          // Callback sau khi animation hoàn thành
          scrollViewRef.current?.scrollTo({
            x: targetX,
            animated: false,
          });
        });

        return nextIndex;
      });
    }, 5000); // Hiển thị mỗi ảnh 8 giây

    return () => clearInterval(autoScrollInterval);
  }, [randomImages.length, scrollAnimation]);

  // ✅ Listener để sync scrollAnimation với ScrollView
  useEffect(() => {
    const listenerId = scrollAnimation.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({
        x: value,
        animated: false, // Không dùng animation của ScrollView
      });
    });

    return () => {
      scrollAnimation.removeListener(listenerId);
    };
  }, [scrollAnimation]);

  // --- TÍNH TOÁN SỐ NGÀY ĐẾM NGƯỢC ĐỘNG (giữ lại cho các phần khác nếu cần) ---
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

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.round(scrollPosition / width);

    // Nếu đã đến ảnh cuối cùng, scroll về ảnh đầu tiên
    if (imageIndex >= randomImages.length - 1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
        setCurrentImageIndex(0);
      }, 300);
    }
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            Platform.OS === "android"
              ? responsiveHeight(80)
              : insets.bottom > 0
              ? insets.bottom
              : responsiveHeight(20),
        }}
      >
        {/* Heart Countdown Widget */}
        <View style={styles.heartCountdownContainer}>
          <Animated.View
            style={[
              styles.heartBackground,
              {
                transform: [{ scale: heartScale }],
                opacity: heartOpacity,
              },
            ]}
          >
            <Heart
              size={responsiveWidth(280)}
              color="#ff6b9d"
              fill="#ff6b9d"
              strokeWidth={1}
            />
          </Animated.View>

          <View style={styles.countdownContent}>
            {(weddingEvent.brideName || weddingEvent.groomName) && (
              <Text style={styles.coupleNames}>
                {weddingEvent.brideName && weddingEvent.groomName
                  ? `${weddingEvent.brideName} & ${weddingEvent.groomName}`
                  : weddingEvent.brideName || weddingEvent.groomName}
              </Text>
            )}
            <Text style={styles.countdownTitle}>Đếm ngược đến ngày cưới</Text>
            <View style={styles.timeUnitsContainer}>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>{timeLeft.days}</Text>
                <Text style={styles.timeLabel}>ngày</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.hours).padStart(2, "0")}
                </Text>
                <Text style={styles.timeLabel}>giờ</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.minutes).padStart(2, "0")}
                </Text>
                <Text style={styles.timeLabel}>phút</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.seconds).padStart(2, "0")}
                </Text>
                <Text style={styles.timeLabel}>giây</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wedding Image Carousel */}
        <View style={styles.imageSection}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            style={styles.carouselContainer}
            scrollEnabled={false}
          >
            {randomImages.map((image, index) => (
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
            {randomImages[currentImageIndex]?.caption || ""}
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

          {(user?.id || user?._id) === weddingEvent.creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("GuestManagementScreen")}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Users size={16} color="white" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Quản lý khách mời</Text>
                  <Text style={styles.menuSubtitle}>
                    Danh sách & sắp xếp bàn
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}

          {/* <TouchableOpacity
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
          </TouchableOpacity> */}

          {/* <TouchableOpacity
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("CommunityScreen")}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <MessageCircle size={16} color="white" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Trang Cộng Đồng</Text>
                <Text style={styles.menuSubtitle}>Chia sẻ & kết nối</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity> */}

          {(user?.id || user?._id) === weddingEvent.creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const accountType = user?.accountType || "FREE";
                const limits = getAccountLimits(accountType);

                if (!limits.canAccessWhoIsNext) {
                  Alert.alert(
                    "Nâng cấp tài khoản",
                    getUpgradeMessage("whoIsNext"),
                    [
                      { text: "Hủy", style: "cancel" },
                      {
                        text: "Nâng cấp",
                        onPress: () =>
                          navigation.navigate("UpgradeAccountScreen"),
                      },
                    ]
                  );
                  return;
                }

                navigation.navigate("WhoIsNextMarried", {
                  member,
                  creatorId: weddingEvent.creatorId,
                });
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <LifeBuoy size={16} color="white" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Ai là người tiếp theo?</Text>
                  <Text style={styles.menuSubtitle}>
                    Minigame dùng trong đám cưới
                  </Text>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  greeting: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(22),
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: responsiveHeight(12),
  },
  greetingText: {
    fontFamily: "Montserrat-Medium",
    color: "#6b7280",
    fontSize: responsiveFont(16),
    lineHeight: responsiveHeight(22),
    marginBottom: responsiveHeight(24),
  },
  heartCountdownContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: responsiveHeight(300),
    marginVertical: responsiveHeight(16),
    marginTop: responsiveHeight(32),
  },
  heartBackground: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  coupleNames: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(18),
    color: "#ffffff",
    marginBottom: responsiveHeight(6),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  countdownTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#ffffff",
    marginBottom: responsiveHeight(10),
    textAlign: "center",
  },
  timeUnitsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(4),
  },
  timeUnit: {
    alignItems: "center",
  },
  timeNumber: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(22),
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(9),
    color: "#ffffff",
    marginTop: responsiveHeight(2),
  },
  timeSeparator: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(18),
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: responsiveHeight(10),
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
    fontSize: responsiveFont(18),
  },
  menuSubtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
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
