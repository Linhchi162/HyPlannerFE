import React, { useCallback } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, ChevronLeft, HelpCircle, Megaphone, MessageCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "../../store/hooks";
import type { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";

type Nav = StackNavigationProp<RootStackParamList>;

export default function AssistantHomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const weddingEvent = useAppSelector(
    (s) => s.weddingEvent.getWeddingEvent.weddingEvent
  );
  const user = useAppSelector((s) => s.auth.user);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#ffffff");
      if (StatusBar.setTranslucent) StatusBar.setTranslucent(false);
      return () => {};
    }, [])
  );

  const greetingName =
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    "bạn";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + responsiveHeight(6) }]}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <ChevronLeft size={24} color="#ff3f6c" />
          <Text style={styles.headerLeftText}>Hỗ trợ khách hàng</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              if (weddingEvent?._id) {
                navigation.navigate("NotificationListScreen", {
                  weddingEventId: weddingEvent._id,
                });
              } else {
                navigation.navigate("Notifications");
              }
            }}
          >
            <Bell size={18} color="#ff3f6c" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("Main", { screen: "Home" })}
          >
            <Ionicons name="home" size={18} color="#ff3f6c" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <LinearGradient
        colors={["#FDECF3", "#F39AB9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.content}
      >
        <Text style={styles.greeting}>Xin chào {greetingName.toUpperCase()}</Text>
        <Text style={styles.title}>Hỷ Kiki có thể giúp gì cho bạn?</Text>

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate("Assistant")}
        >
          <MessageCircle size={18} color="#fff" />
          <Text style={styles.chatBtnText}>Chat Hỷ Kiki</Text>
        </TouchableOpacity>

        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate("UpgradeAccountScreen")}
          >
            <Image
              source={require("../../../assets/images/icon bạn là khách vip hihi.png")}
              style={styles.vipIcon}
              resizeMode="contain"
            />
            <Text style={styles.featureText}>Tại sao nên nâng cấp?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate("CommunityScreen")}
          >
            <Megaphone size={20} color="#ff3f6c" />
            <Text style={styles.featureText}>Các cặp đôi nói gì?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.faqCard}
          onPress={() =>
            Alert.alert(
              "Câu hỏi thường gặp",
              "Bạn có thể bắt đầu bằng cách bấm 'Chat Hỷ Kiki' để hỏi trực tiếp trợ lý."
            )
          }
        >
          <HelpCircle size={20} color="#ff3f6c" />
          <Text style={styles.faqText}>Câu hỏi thường gặp</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fbe3eb",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: responsiveWidth(14),
    paddingBottom: responsiveHeight(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    flex: 1,
  },
  headerLeftText: {
    color: "#ff3f6c",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  headerIconBtn: {
    width: responsiveWidth(34),
    height: responsiveWidth(34),
    borderRadius: responsiveWidth(17),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE8F0",
  },
  divider: {
    height: 1,
    backgroundColor: "#f4bfd0",
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveWidth(14),
    paddingTop: responsiveHeight(18),
    paddingBottom: responsiveHeight(26),
  },
  greeting: {
    color: "#ff3f6c",
    fontSize: responsiveFont(14),
    marginBottom: responsiveHeight(8),
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  title: {
    color: "#111827",
    fontSize: responsiveFont(18),
    lineHeight: responsiveHeight(28),
    fontFamily: "Roboto",
    fontWeight: "700",
    marginBottom: responsiveHeight(16),
  },
  chatBtn: {
    height: responsiveHeight(42),
    borderRadius: responsiveHeight(21),
    backgroundColor: "#ff3f6c",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: responsiveWidth(8),
    alignSelf: "flex-start",
    paddingHorizontal: responsiveWidth(24),
    marginBottom: responsiveHeight(18),
  },
  chatBtnText: {
    color: "#fff",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(15),
  },
  gridRow: {
    flexDirection: "row",
    gap: responsiveWidth(10),
    marginBottom: responsiveHeight(10),
  },
  featureCard: {
    flex: 1,
    minHeight: responsiveHeight(128),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#fff",
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(14),
    justifyContent: "space-between",
  },
  featureText: {
    color: "#111827",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(14),
    lineHeight: responsiveHeight(22),
  },
  vipIcon: {
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    top: responsiveHeight(-19),
    left: responsiveWidth(-14),
    transform: [{ rotate: "-15deg" }],
  },
  faqCard: {
    minHeight: responsiveHeight(120),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#fff",
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(14),
    justifyContent: "space-between",
  },
  faqText: {
    color: "#111827",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(16),
    lineHeight: responsiveHeight(24),
  },
});
