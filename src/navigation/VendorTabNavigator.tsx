import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutTemplate, Users } from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VendorTabParamList } from "./types";
import ChatListScreen from "../screens/chat/ChatListScreen";
import VendorAuthScreen from "../screens/vendor/VendorAuthScreen";
import VendorStackNavigator from "./VendorStackNavigator";
import { onVendorAuthStateChanged } from "../service/vendorAuthService";
import { subscribeChatsByParticipant } from "../service/chatService";
import { getFcmTokenAsync } from "../utils/pushNotification";
import { updateVendorFcmToken } from "../service/vendorService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

const Tab = createBottomTabNavigator<VendorTabParamList>();

export const VendorTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [vendorUser, setVendorUser] = React.useState<null | { uid: string }>(
    null
  );
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const unsub = onVendorAuthStateChanged((user) => {
      setVendorUser(user ? { uid: user.uid } : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!vendorUser?.uid) {
      setUnreadCount(0);
      return;
    }
    const unsub = subscribeChatsByParticipant(vendorUser.uid, (data) => {
      const total = data.reduce((sum, c) => sum + (c.vendorUnread || 0), 0);
      setUnreadCount(total);
    });
    return () => unsub();
  }, [vendorUser?.uid]);

  React.useEffect(() => {
    if (!vendorUser?.uid) return;
    const registerToken = async () => {
      const token = await getFcmTokenAsync();
      if (token) {
        await updateVendorFcmToken(vendorUser.uid, token);
      }
    };
    registerToken();
  }, [vendorUser?.uid]);

  if (loading) return null;
  if (!vendorUser) return <VendorAuthScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => {
          const iconSize = focused ? responsiveWidth(26) : responsiveWidth(22);
          if (route.name === "VendorHome")
            return <LayoutTemplate color={color} size={iconSize} />;
          if (route.name === "VendorLeads")
            return <Users color={color} size={iconSize} />;
          return null;
        },
        tabBarActiveTintColor: "#fd4166",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: {
          fontFamily: "Montserrat-Medium",
          fontSize: responsiveFont(10),
          fontWeight: "600",
          marginTop: responsiveHeight(4),
          marginBottom: responsiveHeight(4),
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 5,
          height:
            responsiveHeight(85) +
            (Platform.OS === "android" ? insets.bottom : 0),
          paddingTop: responsiveHeight(8),
          paddingBottom:
            Platform.OS === "android"
              ? Math.max(insets.bottom, responsiveHeight(8))
              : responsiveHeight(8),
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: responsiveHeight(8),
          marginHorizontal: responsiveWidth(4),
          backgroundColor: "transparent",
        },
        tabBarIconStyle: { marginBottom: responsiveHeight(2) },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="VendorHome"
        component={VendorStackNavigator}
        options={{ tabBarLabel: "Bảng điều khiển" }}
      />
      <Tab.Screen
        name="VendorLeads"
        component={ChatListScreen}
        initialParams={{ role: "vendor" }}
        options={{
          tabBarLabel: "Khách hàng",
          tabBarBadge:
            unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
        }}
      />
    </Tab.Navigator>
  );
};
