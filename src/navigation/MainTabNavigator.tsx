// src/navigation/MainTabNavigator.tsx

import React from "react";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { type StackNavigationProp } from "@react-navigation/stack";
import { Platform, Image } from "react-native";
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
          const iconSize = focused ? responsiveWidth(50) : responsiveWidth(56);
          let iconSource;

          if (route.name === "Home")
            iconSource = require("../../assets/images/icon trang chủ.png");
          else if (route.name === "MoodBoard")
            iconSource = require("../../assets/images/icon tủ đồ.png");
          else if (route.name === "Community")
            iconSource = require("../../assets/images/icon cộng đồng.png");
          else if (route.name === "WebsiteTab")
            iconSource = require("../../assets/images/icon web cưới.png");
          else if (route.name === "ProfileTab")
            iconSource = require("../../assets/images/icon hồ sơ.png");

          return iconSource ? (
            <Image
              source={iconSource}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ) : null;
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#ef456d",
        tabBarLabelStyle: {
          fontFamily: "Montserrat-Medium",
          fontSize: responsiveFont(10),
          fontWeight: "600",
          marginTop: responsiveHeight(4),
          marginBottom: responsiveHeight(4),
          width: responsiveWidth(68),
          textAlign: "center",
        },
        tabBarStyle: {
          backgroundColor: "#fbd0e1",
          borderTopWidth: 0,
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: 0,
          height: responsiveHeight(85),
          paddingTop: responsiveHeight(8),
          paddingBottom: responsiveHeight(10),
          position: "absolute",
          left: 0,
          right: 0,
          bottom: Math.max(insets.bottom, responsiveHeight(12)),
          borderRadius: responsiveWidth(14),
          marginHorizontal: responsiveWidth(20),
        },
        tabBarItemStyle: {
          paddingVertical: responsiveHeight(4),
          marginHorizontal: 0,
          minWidth: responsiveWidth(68),
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
        component={AlbumScreen}
        options={{ tabBarLabel: "Tủ đồ" }}
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
          options={{ tabBarLabel: "Website" }}
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
        component={ProfileScreen}
        options={{ tabBarLabel: "Hồ sơ" }}
      />
    </Tab.Navigator>
  );
};
