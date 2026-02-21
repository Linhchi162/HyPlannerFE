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
  ImageBackground,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUserField } from "../../store/authSlice";
import { getAccountLimits, getUpgradeMessage } from "../../utils/accountLimits";
import apiClient from "../../api/client";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useFocusEffect, useIsFocused } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types"; // Đảm bảo đường dẫn này đúng
import { AppDispatch, RootState } from "../../store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelService } from "../../service/mixpanelService";
import * as notificationService from "../../service/notificationService";
import { getPhases } from "../../service/phaseService";
import { getGroupActivities } from "../../service/groupActivityService";

import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive"; // Đảm bảo đường dẫn này đúng

const { width, height } = Dimensions.get("window");


const HomeScreen = () => {
  // --- LẤY DỮ LIỆU TỪ REDUX STORE ---
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const { weddingEvent, isLoading, error } = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent
  );
  const phases = useSelector(
    (state: RootState) => state.phases.getPhases.phases
  );
  const groupActivities = useSelector(
    (state: RootState) =>
      state.groupActivities.getGroupActivities.groupActivities
  );
  const eventId = weddingEvent?._id;
  const member = weddingEvent?.member || [];
  const [notifUnread, setNotifUnread] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const adScrollX = React.useRef(new Animated.Value(0)).current;
  const adScrollRef = React.useRef<ScrollView>(null);
  const adCardWidth = responsiveWidth(240);
  const adGap = responsiveWidth(12);
  const adSnap = adCardWidth + adGap;
  const currentAdIndexRef = React.useRef(1);
  const isAdjustingLoopRef = React.useRef(false);
  const noteScrollX = React.useRef(new Animated.Value(0)).current;
  const noteScrollRef = React.useRef<ScrollView>(null);
  const noteCardWidth = Math.min(
    responsiveWidth(220),
    width - responsiveWidth(20) * 2 - responsiveWidth(120) - responsiveWidth(12)
  );
  const noteGap = responsiveWidth(12);
  const noteSnap = noteCardWidth + noteGap;
  const currentNoteIndexRef = React.useRef(1);
  const isAdjustingNoteLoopRef = React.useRef(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const isFocused = useIsFocused();

  const fetchNotifUnread = useCallback(async () => {
    if (!eventId) {
      setNotifUnread(0);
      return;
    }
    try {
      const res = await notificationService.getNotifications(eventId, { limit: 1 });
      setNotifUnread(res.unreadCount || 0);
    } catch {
      // ignore
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifUnread();
    }, [fetchNotifUnread])
  );

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

  useFocusEffect(
    useCallback(() => {
      const applyHome = () => {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setBarStyle("light-content");
        if (Platform.OS === "android") StatusBar.setTranslucent(true);
      };
      applyHome();

      return () => {
        StatusBar.setBackgroundColor("#ff5a7a");
        StatusBar.setBarStyle("light-content");
        if (Platform.OS === "android") StatusBar.setTranslucent(false);
      };
    }, [])
  );

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!eventId) return;
      try {
        await Promise.all([
          getPhases(eventId, dispatch),
          getGroupActivities(eventId, dispatch),
        ]);
      } catch {
        // ignore
      }
    };

    fetchSummaryData();
  }, [dispatch, eventId]);

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

  // --- TÍNH TOÁN NGÀY CƯỚI HIỂN THỊ ---
  const weddingDateLabel = useMemo(() => {
    if (!weddingEvent?.timeToMarried) {
      return "";
    }
    return new Date(weddingEvent.timeToMarried).toLocaleDateString("vi-VN");
  }, [weddingEvent?.timeToMarried]);

  const formatMoney = useCallback((value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return `${Math.round(safeValue).toLocaleString("vi-VN")}đ`;
  }, []);

  // --- GIAO DIỆN CHÍNH KHI CÓ DỮ LIỆU ---
  const quickActions = [
    {
      key: "tasks",
      label: "Công việc",
      icon: require("../../../assets/images/icon công việc.png"),
      onPress: () => {
        if (eventId) {
          navigation.navigate("TaskList", { eventId: eventId });
        }
      },
    },
    {
      key: "budget",
      label: "Ngân sách",
      icon: require("../../../assets/images/icon ngân sách.png"),
      onPress: () => {
        if (eventId) {
          navigation.navigate("BudgetList");
        }
      },
    },
    {
      key: "guests",
      label: "Khách mời",
      icon: require("../../../assets/images/icon khách mời.png"),
      onPress: () => {
        if (eventId) {
          navigation.navigate("GuestManagementScreen");
        }
      },
    },
    {
      key: "vendors",
      label: "Đối tác",
      icon: require("../../../assets/images/icon đối tác.png"),
      onPress: () => {
        if (eventId) {
          navigation.navigate("VendorList");
        }
      },
    },
  ];

  const adImages = useMemo(
    () => [
      require("../../../assets/images/ảnh QC bella bridal.jpg"),
      require("../../../assets/images/ảnh QC bảo tín minh châu.jpg"),
      require("../../../assets/images/ảnh QC chung thanh phong bridal.jpg"),
      require("../../../assets/images/ảnh QC doji.jpg"),
      require("../../../assets/images/ảnh QC huy thanh.jpg"),
      require("../../../assets/images/ảnh QC pnj.png"),
      require("../../../assets/images/ảnh QC SJC.jpg"),
      require("../../../assets/images/ảnh QC thế giới kim cương.jpg"),
      require("../../../assets/images/ảnh QC trương thanh hải.jpg"),
    ],
    []
  );

  const loopedAdImages = useMemo(() => {
    if (adImages.length <= 1) return adImages;
    return [adImages[adImages.length - 1], ...adImages, adImages[0]];
  }, [adImages]);

  const accountType = (user?.accountType || "").toLowerCase();
  const isPremium = accountType === "premium" || accountType === "vip";

  const tasks = useMemo(
    () => phases.flatMap((phase) => phase.tasks || []),
    [phases]
  );
  const activities = useMemo(
    () => groupActivities.flatMap((group) => group.activities || []),
    [groupActivities]
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);
  const expectedTotal = activities.reduce(
    (sum, item) => sum + (item.expectedBudget || 0),
    0
  );
  const actualTotal = activities.reduce(
    (sum, item) => sum + (item.actualBudget || 0),
    0
  );
  const totalBudget = weddingEvent?.budget || 0;
  const coupleName = weddingEvent.brideName && weddingEvent.groomName
    ? `${weddingEvent.brideName} & ${weddingEvent.groomName}`
    : weddingEvent.brideName || weddingEvent.groomName || "";

  const splitNameLines = (name: string, mode: "first" | "last") => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [name.trim(), ""];
    if (mode === "first") {
      return [words[0], words.slice(1).join(" ")];
    }
    return [words.slice(0, -1).join(" "), words[words.length - 1]];
  };

  const noteCards = useMemo(
    () => [
      { key: "countdown", type: "countdown" as const },
      {
        key: "tasks",
        type: "tasks" as const,
        title: `${remainingTasks} việc cần làm`,
        subtitle: `${completedTasks} đã hoàn thành/${totalTasks} tổng cộng`,
      },
      {
        key: "budget",
        type: "budget" as const,
        title: "Ngân sách",
        lines: [
          `Tổng tiền: ${formatMoney(totalBudget)}`,
          `Thực tế: ${formatMoney(actualTotal)}`,
          `Dự kiến: ${formatMoney(expectedTotal)}`,
        ],
      },
    ],
    [
      remainingTasks,
      completedTasks,
      totalTasks,
      totalBudget,
      actualTotal,
      expectedTotal,
      formatMoney,
    ]
  );

  const loopedNoteCards = useMemo(() => {
    if (noteCards.length <= 1) return noteCards;
    return [noteCards[noteCards.length - 1], ...noteCards, noteCards[0]];
  }, [noteCards]);

  useEffect(() => {
    if (loopedAdImages.length <= 1) return;

    const timeoutId = setTimeout(() => {
      adScrollRef.current?.scrollTo({ x: adSnap, animated: false });
      currentAdIndexRef.current = 1;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [adSnap, loopedAdImages.length]);

  useEffect(() => {
    if (loopedAdImages.length <= 1) return;

    const interval = setInterval(() => {
      if (isAdjustingLoopRef.current) return;
      const nextIndex = currentAdIndexRef.current + 1;
      adScrollRef.current?.scrollTo({ x: nextIndex * adSnap, animated: true });
    }, 3500);

    return () => clearInterval(interval);
  }, [adSnap, loopedAdImages.length]);

  useEffect(() => {
    if (loopedNoteCards.length <= 1) return;

    const timeoutId = setTimeout(() => {
      noteScrollRef.current?.scrollTo({ x: noteSnap, animated: false });
      currentNoteIndexRef.current = 1;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [noteSnap, loopedNoteCards.length]);

  useEffect(() => {
    if (loopedNoteCards.length <= 1) return;

    const interval = setInterval(() => {
      if (isAdjustingNoteLoopRef.current) return;
      const nextIndex = currentNoteIndexRef.current + 1;
      noteScrollRef.current?.scrollTo({ x: nextIndex * noteSnap, animated: true });
    }, 3200);

    return () => clearInterval(interval);
  }, [noteSnap, loopedNoteCards.length]);

  const handleAdMomentumEnd = useCallback(
    (event: any) => {
      if (loopedAdImages.length <= 1) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const rawIndex = Math.round(offsetX / adSnap);
      currentAdIndexRef.current = rawIndex;

      if (rawIndex === 0) {
        isAdjustingLoopRef.current = true;
        adScrollRef.current?.scrollTo({
          x: adImages.length * adSnap,
          animated: false,
        });
        currentAdIndexRef.current = adImages.length;
        isAdjustingLoopRef.current = false;
      } else if (rawIndex === adImages.length + 1) {
        isAdjustingLoopRef.current = true;
        adScrollRef.current?.scrollTo({ x: adSnap, animated: false });
        currentAdIndexRef.current = 1;
        isAdjustingLoopRef.current = false;
      }
    },
    [adImages.length, adSnap, loopedAdImages.length]
  );

  const handleNoteMomentumEnd = useCallback(
    (event: any) => {
      if (loopedNoteCards.length <= 1) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const rawIndex = Math.round(offsetX / noteSnap);
      currentNoteIndexRef.current = rawIndex;

      if (rawIndex === 0) {
        isAdjustingNoteLoopRef.current = true;
        noteScrollRef.current?.scrollTo({
          x: noteCards.length * noteSnap,
          animated: false,
        });
        currentNoteIndexRef.current = noteCards.length;
        isAdjustingNoteLoopRef.current = false;
      } else if (rawIndex === noteCards.length + 1) {
        isAdjustingNoteLoopRef.current = true;
        noteScrollRef.current?.scrollTo({ x: noteSnap, animated: false });
        currentNoteIndexRef.current = 1;
        isAdjustingNoteLoopRef.current = false;
      }
    },
    [noteCards.length, noteSnap, loopedNoteCards.length]
  );

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

  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
      )}
      <ImageBackground
        source={require("../../../assets/images/ảnh nền hồng - trang chủ.jpg")}
        style={styles.homeBackground}
        resizeMode="cover"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SafeAreaView style={styles.headerContent}>
            <View
              style={[
                styles.headerRow,
                { paddingTop: insets.top + responsiveHeight(6) },
              ]}
            >
              <Image
                source={require("../../../assets/images/hyLogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerCircleButton}
                  onPress={() => Alert.alert("Thông báo", "Tính năng Chatbot AI đang được phát triển!")}
                >
                  <Image
                    source={require("../../../assets/images/icon bong bóng chat với vendors.png")}
                    style={styles.headerCircleIconSmall}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerCircleButton}
                  onPress={() => Alert.alert("Thông báo", "Trợ lý đang được phát triển!")}
                >
                  <Image
                    source={require("../../../assets/images/icon khỉ trợ lý.png")}
                    style={styles.headerCircleIconLarge}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerCircleButton}
                  onPress={() => {
                    if (eventId) {
                      navigation.navigate("NotificationListScreen", {
                        weddingEventId: eventId,
                      });
                    } else {
                      navigation.navigate("Notifications");
                    }
                  }}
                >
                  <View style={styles.notificationIconWrap}>
                    <Image
                      source={require("../../../assets/images/icon thông báo.png")}
                      style={styles.headerCircleIconSmall}
                      resizeMode="contain"
                    />
                    {notifUnread > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>
                          {notifUnread > 99 ? "99+" : notifUnread}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          <View style={styles.heroRow}>
            <View style={styles.upgradeCard}>
              <Image
                source={require("../../../assets/images/icon user hỷ.png")}
                style={styles.upgradeAvatar}
                resizeMode="contain"
              />
              <View style={styles.upgradeCardBody}>
                <Text style={styles.upgradeTitle}>
                  {isPremium ? "Khách VIP" : "Nâng cấp tài khoản"}
                </Text>
                <Image
                  source={
                    isPremium
                      ? require("../../../assets/images/icon bạn là khách vip hihi.png")
                      : require("../../../assets/images/icon bạn chỉ là hạng dùng free.png")
                  }
                  style={styles.upgradeBadge}
                  resizeMode="contain"
                />
                {!isPremium && (
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate("UpgradeAccountScreen")}
                  >
                    <Text style={styles.upgradeButtonText}>Nâng cấp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.noteCarousel}>
              <Animated.ScrollView
                ref={noteScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={noteSnap}
                decelerationRate="fast"
                onMomentumScrollEnd={handleNoteMomentumEnd}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: noteScrollX } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={[
                  styles.noteRow,
                  {
                    paddingLeft: 0,
                    paddingRight: 0,
                  },
                ]}
              >
                {loopedNoteCards.map((note, index) => {
                  return (
                    <Animated.View
                      key={`note-${note.key}-${index}`}
                      style={[
                        styles.noteCard,
                        note.type !== "countdown" && styles.noteCardTopLeft,
                        note.type === "countdown" && styles.noteCardCountdown,
                        { width: noteCardWidth },
                      ]}
                    >
                      {note.type === "countdown" ? (
                        <>
                          <View style={styles.noteNameRow}>
                            <View style={styles.noteNameColumn}>
                              {weddingEvent.brideName ? (
                                <>
                                  <Text style={styles.noteNameText}>
                                    {splitNameLines(weddingEvent.brideName, "last")[0]}
                                  </Text>
                                  <Text style={styles.noteNameText}>
                                    {splitNameLines(weddingEvent.brideName, "last")[1]}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                            <Text style={styles.noteAmpersand}>&</Text>
                            <View style={styles.noteNameColumn}>
                              {weddingEvent.groomName ? (
                                <>
                                  <Text style={styles.noteNameText}>
                                    {splitNameLines(weddingEvent.groomName, "first")[0]}
                                  </Text>
                                  <Text style={styles.noteNameText}>
                                    {splitNameLines(weddingEvent.groomName, "first")[1]}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                          </View>
                          <View style={styles.noteCountdownRow}>
                            <Text style={styles.noteCountdownTextSmall}>{timeLeft.days}</Text>
                            <Text style={styles.noteCountdownSeparator}>:</Text>
                            <Text style={styles.noteCountdownTextSmall}>
                              {String(timeLeft.hours).padStart(2, "0")}
                            </Text>
                            <Text style={styles.noteCountdownSeparator}>:</Text>
                            <Text style={styles.noteCountdownTextSmall}>
                              {String(timeLeft.minutes).padStart(2, "0")}
                            </Text>
                            <Text style={styles.noteCountdownSeparator}>:</Text>
                            <Text style={styles.noteCountdownTextSmall}>
                              {String(timeLeft.seconds).padStart(2, "0")}
                            </Text>
                          </View>
                          <View style={styles.noteCountdownLabels}>
                            <Text style={styles.noteCountdownLabelSmall}>ngày</Text>
                            <Text style={styles.noteCountdownLabelSmall}>giờ</Text>
                            <Text style={styles.noteCountdownLabelSmall}>phút</Text>
                            <Text style={styles.noteCountdownLabelSmall}>giây</Text>
                          </View>
                          <View style={styles.noteDateRow}>
                            <Image
                              source={require("../../../assets/images/icon trái tim trong trắng.png")}
                              style={styles.noteHeartIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.noteDateTextSmall}>{weddingDateLabel}</Text>
                            <Image
                              source={require("../../../assets/images/icon trái tim trong trắng.png")}
                              style={styles.noteHeartIcon}
                              resizeMode="contain"
                            />
                          </View>
                        </>
                      ) : note.type === "tasks" ? (
                        <>
                          <Text style={[styles.noteTitle, styles.noteTitleLeft]}>
                            {note.title}
                          </Text>
                          <Text style={[styles.noteSubtitle, styles.noteSubtitleLeft]}>
                            {note.subtitle}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.noteTitle, styles.noteTitleLeft]}>
                            {note.title}
                          </Text>
                          <Text
                            style={[
                              styles.noteSubtitle,
                              styles.noteSubtitleLeft,
                              styles.noteSubtitleStrong,
                            ]}
                          >
                            {note.lines[0]}
                          </Text>
                          {note.lines.slice(1).map((line) => (
                            <Text
                              key={line}
                              style={[styles.noteSubtitle, styles.noteSubtitleLeft]}
                            >
                              {line}
                            </Text>
                          ))}
                        </>
                      )}
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            </View>
          </View>

          <View
            style={[
              styles.contentCard,
              {
                minHeight: height,
                paddingBottom: Math.max(
                  insets.bottom + responsiveHeight(84),
                  responsiveHeight(120)
                ),
              },
            ]}
          >
            <View style={styles.quickActionsRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickActionItem}
                  onPress={action.onPress}
                  disabled={!eventId}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Image
                      source={action.icon}
                      style={styles.quickActionIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dividerRow}>
              <TouchableOpacity
                style={styles.dividerButton}
                onPress={() => setIsExpanded((prev) => !prev)}
              >
                <Image
                  source={require("../../../assets/images/icon ẩn thông báo đi.png")}
                  style={[
                    styles.dividerIcon,
                    isExpanded && styles.dividerIconExpanded,
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View style={styles.dividerLine} />
            </View>

            {isExpanded && (
              <View style={styles.miniGameSection}>
                <Text style={styles.sectionTitle}>Minigame dùng trong đám cưới</Text>
                <TouchableOpacity
                  style={styles.miniGameCard}
                  onPress={() => {
                    const limits = getAccountLimits(user?.accountType || "FREE");
                    if (!limits.canAccessWhoIsNext) {
                      Alert.alert(
                        "Nâng cấp tài khoản",
                        getUpgradeMessage("whoIsNext"),
                        [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Nâng cấp",
                            onPress: () => navigation.navigate("UpgradeAccountScreen"),
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
                  <View style={styles.miniGameIconWrap}>
                    <Image
                      source={require("../../../assets/images/icon minigame.png")}
                      style={styles.miniGameIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.miniGameTextWrap}>
                    <Text style={styles.miniGameTitle} numberOfLines={2}>
                      Ai là người kết hôn tiếp theo
                    </Text>
                    <Text style={styles.miniGameSubtitle}>Minigame vui nhộn</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <Animated.ScrollView
              ref={adScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={adSnap}
              decelerationRate="fast"
              style={styles.adScroll}
              onMomentumScrollEnd={handleAdMomentumEnd}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: adScrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              contentContainerStyle={styles.adRow}
            >
              {loopedAdImages.map((img, index) => {
                const inputRange = [
                  (index - 1) * adSnap,
                  index * adSnap,
                  (index + 1) * adSnap,
                ];
                const scale = adScrollX.interpolate({
                  inputRange,
                  outputRange: [0.88, 1.08, 0.88],
                  extrapolate: "clamp",
                });

                return (
                  <Animated.View
                    key={`ad-${index}`}
                    style={[styles.adCard, { transform: [{ scale }] }]}
                  >
                    <Image source={img} style={styles.adImage} resizeMode="cover" />
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContent: {
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(20),
    paddingTop: 0,
  },
  logo: {
    width: responsiveWidth(64),
    height: responsiveHeight(54),
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
  },
  headerCircleButton: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCircleIconSmall: {
    width: responsiveWidth(55),
    height: responsiveWidth(55),
    tintColor: "#ff4f8a",
  },
  headerCircleIconLarge: {
    width: responsiveWidth(86),
    height: responsiveWidth(86),
    tintColor: "#ff4f8a",
    marginLeft: responsiveWidth(2),
    marginTop: responsiveHeight(2),
  },
  notificationIconWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadge: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(2),
    minWidth: responsiveWidth(16),
    height: responsiveWidth(16),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ff5a7a",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(9),
    color: "#ff5a7a",
  },
  homeBackground: {
    flex: 1,
    paddingBottom: responsiveHeight(20),
  },
  scrollContent: {
    paddingBottom: 0,
  },
  heroRow: {
    marginTop: responsiveHeight(12),
    marginHorizontal: responsiveWidth(20),
    flexDirection: "row",
    gap: responsiveWidth(12),
    alignItems: "flex-start",
  },
  upgradeCard: {
    width: responsiveWidth(100),
    backgroundColor: "transparent",
    alignItems: "center",
  },
  upgradeCardBody: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.59)",
    borderRadius: responsiveWidth(18),
    paddingTop: responsiveHeight(4),
    paddingBottom: responsiveHeight(0),
    paddingHorizontal: responsiveWidth(4),
    alignItems: "center",
    overflow: "visible",
  },
  upgradeAvatar: {
    width: responsiveWidth(150),
    height: responsiveWidth(160),
    marginBottom: responsiveHeight(-50),
    marginTop: responsiveHeight(-30),
  },
  upgradeTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(10),
    color: "#ff4f8a",
    textAlign: "center",
    marginBottom: responsiveHeight(2),
  },
  upgradeBadge: {
    width: responsiveWidth(60),
    height: responsiveWidth(35),
    position: "absolute",
    top: -responsiveHeight(20),
    left: responsiveWidth(-25),
    transform: [{ rotate: "-24deg" }],
    alignSelf: "center",
  },
  upgradeButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(4),
    borderRadius: responsiveWidth(10),
  },
  upgradeButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(10),
    color: "#ff4f8a",
  },
  heroCard: {
    flex: 1,
    paddingVertical: responsiveHeight(18),
    paddingHorizontal: responsiveWidth(16),
    borderRadius: responsiveWidth(22),
    backgroundColor: "rgba(231, 120, 149, 0.85)",
    alignItems: "center",
  },
  heroNames: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#ffffff",
    marginBottom: responsiveHeight(8),
  },
  heroCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
  },
  heroCountdownText: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(22),
    color: "#ffffff",
    letterSpacing: 1,
  },
  heroCountdownSeparator: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(18),
    color: "#ffffff",
    opacity: 0.8,
  },
  heroCountdownLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: responsiveWidth(8),
    marginTop: responsiveHeight(4),
  },
  heroCountdownLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(10),
    color: "#ffffff",
    opacity: 0.9,
  },
  heroDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
    marginTop: responsiveHeight(8),
  },
  heroDateText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#ffffff",
  },
  heroHeartIcon: {
    width: responsiveWidth(16),
    height: responsiveWidth(16),
    tintColor: "#ffffff",
  },
  noteCarousel: {
    flex: 1,
    marginRight: -responsiveWidth(20),
  },
  noteRow: {
    gap: responsiveWidth(14),
    paddingVertical: 0,
  },
  noteCard: {
    width: responsiveWidth(200),
    minHeight: responsiveHeight(110),
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(14),
    borderRadius: responsiveWidth(20),
    backgroundColor: "rgba(231, 120, 149, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  noteCardTopLeft: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  noteCardCountdown: {
    paddingTop: responsiveHeight(20),
  },
  noteTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#ffffff",
    marginBottom: responsiveHeight(6),
  },
  noteTitleLeft: {
    textAlign: "left",
    alignSelf: "stretch",
  },
  noteSubtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#ffffff",
    opacity: 0.95,
    marginTop: responsiveHeight(2),
  },
  noteSubtitleStrong: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(11),
    opacity: 1,
    marginTop: responsiveHeight(2),
  },
  noteSubtitleLeft: {
    textAlign: "left",
    alignSelf: "stretch",
  },
  noteNameRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsiveHeight(6),
  },
  noteNameColumn: {
    flex: 1,
    alignItems: "center",
  },
  noteNameText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#ffffff",
    lineHeight: responsiveHeight(16),
  },
  noteAmpersand: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#ffffff",
    marginHorizontal: responsiveWidth(6),
  },
  noteCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
  },
  noteCountdownText: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(20),
    color: "#ffffff",
    letterSpacing: 1,
  },
  noteCountdownTextSmall: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(18),
    color: "#ffffff",
    letterSpacing: 1,
  },
  noteCountdownSeparator: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(16),
    color: "#ffffff",
    opacity: 0.8,
  },
  noteCountdownLabels: {
    flexDirection: "row",
    justifyContent: "center",
    gap: responsiveWidth(19),
    width: "100%",
    paddingHorizontal: responsiveWidth(2),
    marginTop: responsiveHeight(4),
  },
  noteCountdownLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(9),
    color: "#ffffff",
    opacity: 0.9,
  },
  noteCountdownLabelSmall: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(8),
    color: "#ffffff",
    opacity: 0.9,
  },
  noteDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    marginTop: responsiveHeight(6),
  },
  noteDateText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#ffffff",
  },
  noteDateTextSmall: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#ffffff",
  },
  noteHeartIcon: {
    width: responsiveWidth(18),
    height: responsiveWidth(14),
    tintColor: "#ffffff",
  },
  quickActionsRow: {
    paddingTop: responsiveHeight(8),
    paddingBottom: responsiveHeight(6),
    paddingHorizontal: responsiveWidth(6),
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickActionItem: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIconWrap: {
    width: responsiveWidth(61),
    height: responsiveWidth(57),
    borderRadius: responsiveWidth(9),
    backgroundColor: "#fde8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(6),
    marginTop: responsiveHeight(15),
  },
  quickActionIcon: {
    width: responsiveWidth(86),
    height: responsiveWidth(90),
    tintColor: "#ff4f78",

  },
  quickActionLabel: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#1f2937",
  },
  contentCard: {
    marginTop: responsiveHeight(16),
    marginHorizontal: 0,
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(18),
    paddingHorizontal: responsiveWidth(18),
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(28),
    borderTopRightRadius: responsiveWidth(28),
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveHeight(10),
    marginBottom: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(50),
    position: "relative",
  },
  dividerLine: {
    position: "absolute",
    left: responsiveWidth(50),
    right: responsiveWidth(50),
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.12)",
  },
  dividerButton: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(15),
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: responsiveWidth(10),
    zIndex: 1,
  },
  dividerIcon: {
    width: responsiveWidth(55),
    height: responsiveWidth(55),

  },
  dividerIconExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  miniGameSection: {
    marginBottom: responsiveHeight(12),
  },
  adRow: {
    gap: responsiveWidth(12),
    paddingLeft: (width - responsiveWidth(240)) / 2,
    paddingRight: (width - responsiveWidth(240)) / 2,
    paddingVertical: responsiveHeight(6),
  },
  adScroll: {
    marginHorizontal: -responsiveWidth(18),
  },
  adCard: {
    width: responsiveWidth(240),
    height: responsiveWidth(130),
    borderRadius: responsiveWidth(18),
    overflow: "hidden",
  },
  adImage: {
    width: "100%",
    height: "100%",
  },
  sectionTitle: {
    marginTop: responsiveHeight(18),
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
  },
  miniGameCard: {
    marginTop: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3f7",
    borderRadius: responsiveWidth(18),
    padding: responsiveWidth(14),
  },
  miniGameIconWrap: {
    width: responsiveWidth(54),
    height: responsiveWidth(54),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#ffe0eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(12),
  },
  miniGameIcon: {
    width: responsiveWidth(28),
    height: responsiveWidth(28),
  },
  miniGameTextWrap: {
    flex: 1,
  },
  miniGameTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  miniGameSubtitle: {
    marginTop: responsiveHeight(4),
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
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
