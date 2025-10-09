// src/navigation/MainTabNavigator.tsx

import React from "react";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { type StackNavigationProp } from "@react-navigation/stack";
import { Home, User, Heart, LayoutTemplate } from "lucide-react-native";

import HomeScreen from "../screens/HomeScreen";
import { useAppSelector } from "../store/hooks";
import { selectUserInvitation } from "../store/invitationSlice";
import { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Component này không bao giờ hiển thị, chỉ dùng làm placeholder
const DummyComponent = () => null;

export const MainTabNavigator = () => {
  const userInvitation = useAppSelector(selectUserInvitation);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? 26 : 22;
          if (route.name === "Home")
            return <Home color={color} size={iconSize} />;
          if (route.name === "WebsiteTab")
            return <LayoutTemplate color={color} size={iconSize} />;
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
          fontSize: 12,
          fontWeight: "600",
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 5,
          height: 85,
          paddingTop: 8,
          paddingBottom: 8,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          marginHorizontal: 4,
          backgroundColor: "transparent",
        },
        tabBarIconStyle: { marginBottom: 2 },
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
        options={{ tabBarLabel: "Bảng tâm trạng" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Album");
          },
        }}
      />
      <Tab.Screen
        name="WebsiteTab"
        component={DummyComponent}
        options={{ tabBarLabel: "Website" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (userInvitation) {
              navigation.navigate("WebsiteManagement", {
                invitation: userInvitation,
              });
            } else {
              navigation.navigate("InvitationLettersScreen");
            }
          },
        }}
      />
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
