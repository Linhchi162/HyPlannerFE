import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  const scrollX = React.useRef(new Animated.Value(0)).current; // Dùng để điều khiển vị trí lướt
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  // Animation cho trái tim
  const heartScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Đồng bộ giá trị Animated với ScrollView
    const listenerId = scrollX.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ x: value, animated: false });
    });
    return () => scrollX.removeListener(listenerId);
  }, []);

  // Countdown state (theo giây)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  // Panel hồng luôn xuất hiện trên Home; set ngay + set lại sau 1 frame để thắng cleanup từ Tủ đồ/Cộng đồng (tránh top panel bị đẩy lên)
  useFocusEffect(
    useCallback(() => {
      const apply = () => {
        StatusBar.setBackgroundColor("#ff5a7a");
        StatusBar.setBarStyle("light-content");
        if (Platform.OS === "android") StatusBar.setTranslucent(false);
      };
      apply();
      const id = setTimeout(apply, 0);
      return () => clearTimeout(id);
    }, [])
  );

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
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []); // ✅ FIXED: Empty deps array - animation chỉ start 1 lần

  // Auto-scroll carousel với transition mượt mà chuẩn Native
  useEffect(() => {
    if (randomImages.length === 0) return;

    const autoScrollInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % randomImages.length;
        const targetX = nextIndex * width;

        // Sử dụng Animated.timing để kiểm soát tốc độ lướt (1000ms = 1 giây)
        Animated.timing(scrollX, {
          toValue: targetX,
          duration: 500, // --- GIẢM TỐC ĐỘ LƯỚT (1.5 giây) ---
          useNativeDriver: false,
        }).start();

        return nextIndex;
      });
    }, 5000); // 5 giây đổi ảnh 1 lần

    return () => clearInterval(autoScrollInterval);
  }, [randomImages.length, width]);

  // --- TÍNH TOÁN SỐ NGÀY ĐẾM NGƯỢC ĐỘNG (giữ lại cho các phần khác nếu cần) ---
  const weddingDateLabel = useMemo(() => {
    if (!weddingEvent?.timeToMarried) {
      return "";
    }
    return new Date(weddingEvent.timeToMarried).toLocaleDateString("vi-VN");
  }, [weddingEvent?.timeToMarried]);

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
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#ff5a7a"
        translucent={false}
      />

      {/* Top Panel Section - Đã chuyển sang nền trong suốt và nổi lên trên */}
      <View style={styles.topPanelContainer} pointerEvents="box-none">
        <Image
          source={require("../../../assets/images/top.png")}
          style={styles.topPanelBg}
          resizeMode="stretch"
        />
        <SafeAreaView style={styles.headerContent} pointerEvents="box-none">
          <View style={styles.headerRow} pointerEvents="box-none">
            <Image
              source={require("../../../assets/images/hyLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => Alert.alert("Thông báo", "Tính năng Chatbot AI đang được phát triển!")}
              >
                <Image
                  source={require("../../../assets/images/ai.png")}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate("Notifications")}
              >
                <Image
                  source={require("../../../assets/images/notification.png")}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: responsiveHeight(200), // Tăng lên để tránh cắt phần đáy top.png
          paddingBottom:
            Platform.OS === "android"
              ? responsiveHeight(80)
              : insets.bottom > 0
                ? insets.bottom
                : responsiveHeight(20),
        }}
      >
        {/* Wedding Image Carousel - Đã chuyển lên đầu và tràn màn hình */}
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

        {/* Heart Countdown Widget */}
        <View style={styles.heartCountdownContainer}>
          <Animated.View
            style={[
              styles.heartBackground,
              {
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Image
              source={require("../../../assets/images/name_heart.png")}
              style={styles.heartImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Image
            source={require("../../../assets/images/side_flowers.png")}
            style={[styles.sideFlower, styles.sideFlowerLeft]}
            resizeMode="contain"
          />
          <Image
            source={require("../../../assets/images/side_flowers.png")}
            style={[styles.sideFlower, styles.sideFlowerRight]}
            resizeMode="contain"
          />

          <View style={styles.countdownContent}>
            {(weddingEvent.brideName || weddingEvent.groomName) && (
              <View style={styles.namesContainer}>
                {weddingEvent.brideName && weddingEvent.groomName ? (
                  <>
                    <Text style={styles.nameText}>{weddingEvent.brideName}</Text>
                    <Text style={styles.ampersandText}>&</Text>
                    <Text style={styles.nameText}>{weddingEvent.groomName}</Text>
                  </>
                ) : (
                  <Text style={styles.nameText}>
                    {weddingEvent.brideName || weddingEvent.groomName}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.timeUnitsContainer}>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>{timeLeft.days}</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.hours).padStart(2, "0")}
                </Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.minutes).padStart(2, "0")}
                </Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <Text style={styles.timeNumber}>
                  {String(timeLeft.seconds).padStart(2, "0")}
                </Text>
              </View>
            </View>
            {weddingDateLabel ? (
              <Text style={styles.weddingDateText}>{weddingDateLabel}</Text>
            ) : null}
          </View>
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
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Danh sách của bạn</Text>
                <Text style={styles.menuSubtitle}>Danh sách công việc</Text>
              </View>
            </View>
            <Image
              source={require("../../../assets/images/forward.png")}
              style={styles.menuArrow}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {(user?.id || user?._id) === weddingEvent.creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("BudgetList")}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Ngân sách của bạn</Text>
                  <Text style={styles.menuSubtitle}>Danh sách ngân sách</Text>
                </View>
              </View>
              <Image
                source={require("../../../assets/images/forward.png")}
                style={styles.menuArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {(user?.id || user?._id) === weddingEvent.creatorId && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("GuestManagementScreen")}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Quản lý khách mời</Text>
                  <Text style={styles.menuSubtitle}>
                    Danh sách & sắp xếp bàn
                  </Text>
                </View>
              </View>
              <Image
                source={require("../../../assets/images/forward.png")}
                style={styles.menuArrow}
                resizeMode="contain"
              />
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
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Ai là người tiếp theo?</Text>
                  <Text style={styles.menuSubtitle}>
                    Minigame dùng trong đám cưới
                  </Text>
                </View>
              </View>
              <Image
                source={require("../../../assets/images/forward.png")}
                style={styles.menuArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topPanelContainer: {
    width: "100%",
    height: responsiveHeight(110), // Panel giấy cao hơn
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "transparent",
  },
  topPanelBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  headerContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(20),
    paddingTop: Platform.OS === "android" ? responsiveHeight(15) : responsiveHeight(8), // Logo và nút cao hơn trên panel
    backgroundColor: "transparent",
  },
  logo: {
    width: responsiveWidth(64),
    height: responsiveHeight(54),
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(15),
  },
  headerButton: {
    width: responsiveWidth(50),
    height: responsiveWidth(56),
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    height: responsiveHeight(270),
    marginTop: -responsiveHeight(230), // Đẩy nhẹ lên để lồng vào mép rách giấy
    marginBottom: responsiveHeight(16),
  },
  heartBackground: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sideFlower: {
    position: "absolute",
    width: responsiveWidth(190),
    height: responsiveWidth(180),
    zIndex: 1,
  },
  sideFlowerLeft: {
    left: -responsiveWidth(35),
    top: responsiveHeight(20),
    transform: [{ scaleX: -1 }],
  },
  sideFlowerRight: {
    right: -responsiveWidth(35),
    top: responsiveHeight(20),
    transform: [{ scaleX: 1 }],
  },
  heartImage: {
    width: responsiveWidth(350),
    height: responsiveWidth(330),
  },
  countdownContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  namesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: responsiveWidth(280), // Khung tên hẹp để tự xuống dòng nếu dài
    marginBottom: responsiveHeight(-20),
    marginTop: responsiveHeight(-40),
  },
  nameText: {
    fontFamily: "Charm-Bold",
    fontSize: responsiveFont(20),
    color: "#fd4166",
    textAlign: "center",
    maxWidth: responsiveWidth(120),
  },
  ampersandText: {
    fontFamily: "Charm-Bold",
    fontSize: responsiveFont(20),
    color: "#fd4166",
    textAlign: "center",
    marginHorizontal: responsiveWidth(0),
  },
  countdownTitle: {
    fontFamily: "Charm-Bold",

    fontSize: responsiveFont(12),
    color: "#fd4166",
    marginBottom: responsiveHeight(10),
    textAlign: "center",
  },
  timeUnitsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(5),
  },
  timeUnit: {
    alignItems: "center",
  },
  timeNumber: {
    fontFamily: "Charm-Bold",
    fontSize: responsiveFont(26),
    color: "#fd4166",
    marginTop: responsiveHeight(-6),
  },
  timeLabel: {
    fontFamily: "Charm-Bold",
    fontSize: responsiveFont(9),
    color: "#fd4166",
    marginTop: responsiveHeight(2),
  },
  timeSeparator: {
    fontFamily: "Charm-Bold",
    fontSize: responsiveFont(17),
    fontWeight: "bold",
    color: "#fd4166",
    marginBottom: responsiveHeight(-5),
  },
  weddingDateText: {
    marginTop: responsiveHeight(-20),
    fontFamily: "Charm-Regular",
    fontSize: responsiveFont(17),
    color: "#fd4166",
    opacity: 1,
    textAlign: "center",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  countdownNumber: {
    fontFamily: "Charm-regular",
    fontSize: responsiveFont(36),
    fontWeight: "bold",
    color: "#ff6b9d",
  },
  countdownLabel: {
    fontFamily: "Charm-regular",
    color: "#6b7280",
    fontSize: responsiveFont(24),
  },
  imageSection: {
    marginBottom: responsiveHeight(16),
    marginTop: -responsiveHeight(140), // Đẩy lên để bắt đầu ngay từ đầu ScrollView
  },
  carouselContainer: {
    // Để trống vì nó đã tự động theo chiều rộng màn hình
  },
  imageContainer: {
    width: width, // Tràn màn hình
    marginHorizontal: 0,
    borderRadius: 0, // Bỏ bo góc
    overflow: "hidden",
  },
  weddingImage: {
    width: "100%",
    height: width * 1.2, // Tăng chiều cao để ảnh trông sang trọng hơn
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
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: responsiveWidth(16),
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  menuTextContainer: {
    gap: responsiveHeight(2),
  },
  menuTitle: {
    fontFamily: "MavenPro",
    fontWeight: "500",
    color: "#fd4166",
    textShadowColor: "rgba(236, 182, 192, 0.6)",
    textShadowOffset: { width: -1, height: 1.5 },
    textShadowRadius: 2,
    fontSize: responsiveFont(22),
  },
  menuSubtitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(16),
    color: "rgba(226, 62, 92, 0.6)",


  },
  menuArrow: {
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    marginLeft: responsiveWidth(8),
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
