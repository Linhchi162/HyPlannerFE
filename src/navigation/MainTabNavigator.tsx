// src/navigation/MainTabNavigator.tsx

import React from "react";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { type StackNavigationProp } from "@react-navigation/stack";
import { Home, User, Heart, LayoutTemplate, Users } from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/home/HomeScreen";
import CommunityScreen from "../screens/community/CommunityScreen";
import AlbumScreen from "../screens/album/AlbumScreen";
import WebsiteManagementScreen from "../screens/invitation/WebsiteManagementScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import { useAppSelector } from "../store/hooks";
import { selectUserInvitation } from "../store/invitationSlice";
import { MainTabParamList, RootStackParamList } from "./types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Component này không bao giờ hiển thị, chỉ dùng làm placeholder
const DummyComponent = () => null;

export const MainTabNavigator = () => {
  const userInvitation = useAppSelector(selectUserInvitation);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const weddingEvent = useAppSelector(
    (state) => state.weddingEvent.getWeddingEvent.weddingEvent
  );
  const user = useAppSelector((state) => state.auth.user);
  const isCreator = (user?.id || user?._id) === weddingEvent.creatorId;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? responsiveWidth(26) : responsiveWidth(22);
          if (route.name === "Home")
            return <Home color={color} size={iconSize} />;
          if (route.name === "WebsiteTab")
            return <LayoutTemplate color={color} size={iconSize} />;
          if (route.name === "Community")
            return <Users color={color} size={iconSize} />;
          if (route.name === "MoodBoard")
            return <Heart color={color} size={iconSize} />;
          if (route.name === "ProfileTab")
            return <User color={color} size={iconSize} />;
          return null;
        },
        tabBarActiveTintColor: "#ff6b9d",
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
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Trang chủ" }}
      />
      <Tab.Screen
        name="MoodBoard"
        component={DummyComponent}
        options={{ tabBarLabel: "Tủ đồ" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Album");
          },
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: "Cộng đồng" }}
      />
      {isCreator && (
        <Tab.Screen
          name="WebsiteTab"
          component={WebsiteManagementScreen}
          options={{ tabBarLabel: "Quản lí Website" }}
          listeners={{
            tabPress: (e) => {
              if (!userInvitation) {
                e.preventDefault();
                navigation.navigate("InvitationLettersScreen");
              }
            },
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={DummyComponent}
        options={{ tabBarLabel: "Hồ sơ" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Profile");
          },
        }}
      />
    </Tab.Navigator>
  );
};
