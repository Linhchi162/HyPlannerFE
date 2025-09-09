import { useState, useEffect } from "react";
import { Text, View, Image, StyleSheet, TouchableOpacity } from "react-native";
import {
  NavigationContainer,
  type LinkingOptions,
  useNavigation,
} from "@react-navigation/native";
import {
  createStackNavigator,
  type StackNavigationProp,
} from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import các màn hình
import BeginScreen from "../screens/BeginScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MoodBoardsScreen from "../screens/MoodBoardsScreen";
import TodoListScreen from "../screens/TodoListScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

// ===== IMPORT LẠI ICON USER =====
import { Home, User, Heart, Bell } from "lucide-react-native";

const scheme = process.env.EXPO_PUBLIC_SCHEME;

// --- ĐỊNH NGHĨA TYPE (GIỮ NGUYÊN NHƯ TRƯỚC) ---
export type RootStackParamList = {
  Login: undefined;
  Main: {
    screen: string;
    params?: { token: string; user?: any };
  };
  TodoList: undefined;
  Profile: undefined;
  BeginScreen: undefined;
};

// ===== CẬP NHẬT LẠI TYPE CHO TAB =====
export type MainTabParamList = {
  Home: { token: string; user?: any };
  Notifications: undefined;
  MoodBoard: undefined;
  // Thêm một route giả cho tab Profile
  ProfileTab: undefined;
  BeginScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// --- COMPONENT NÀY SẼ KHÔNG BAO GIỜ HIỂN THỊ ---
// Nó chỉ dùng để làm `component` cho Tab.Screen
const DummyComponent = () => null;

// --- COMPONENT HEADER AVATAR (GIỮ NGUYÊN) ---
const HeaderAvatar = () => {
  const [picture, setPicture] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // ... logic tải ảnh giữ nguyên
    const loadUserData = async () => {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setPicture(userData.picture || null);
      }
    };
    loadUserData();
  }, []);

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  return (
    <TouchableOpacity onPress={navigateToProfile}>
      {picture ? (
        <Image source={{ uri: picture }} style={headerStyles.avatar} />
      ) : (
        <View style={headerStyles.avatar} />
      )}
    </TouchableOpacity>
  );
};

// --- COMPONENT TAB NAVIGATOR (CẬP NHẬT QUAN TRỌNG) ---
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? 26 : 22;
          if (route.name === "Home")
            return <Home color={color} size={iconSize} />;
          if (route.name === "Notifications")
            return <Bell color={color} size={iconSize} />;
          if (route.name === "MoodBoard")
            return <Heart color={color} size={iconSize} />;
          if (route.name === "ProfileTab")
            return <User color={color} size={iconSize} />;
          return null;
        },
        tabBarActiveTintColor: "#ff6b9d",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05, // Lowered for less intensity
          shadowRadius: 2, // Reduced for a tighter shadow
          elevation: 5, // Corresponding reduction for Android
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
        tabBarIconStyle: {
          marginBottom: 2,
        },
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
        component={MoodBoardsScreen}
        options={{ tabBarLabel: "Bảng tâm trạng" }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: "Thông báo" }}
      />
      {/* ===== THÊM LẠI TAB HỒ SƠ VỚI LISTENER ===== */}
      <Tab.Screen
        name="ProfileTab"
        component={DummyComponent} // Sử dụng component rỗng
        options={{
          tabBarLabel: "Hồ sơ",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Ngăn hành động mặc định
            e.preventDefault();
            // Điều hướng đến màn hình Profile trong Stack
            navigation.getParent()?.navigate("Profile");
          },
        })}
      />
    </Tab.Navigator>
  );
};

// --- CẤU HÌNH LINKING ---
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${scheme}://`],
  config: { screens: { Login: "auth" } },
};

// --- NAVIGATOR CHÍNH CỦA APP (GIỮ NGUYÊN NHƯ TRƯỚC) ---
const AppNavigator = () => (
  <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
    <Stack.Navigator initialRouteName="BeginScreen">
      <Stack.Screen
        name="BeginScreen"
        component={BeginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{
          headerTitle: "Hỷ Planner",
          headerTitleStyle: headerStyles.title,
          headerRight: () => <HeaderAvatar />,
          headerLeft: () => <View style={{ width: 15 }} />,
          headerTitleAlign: "left",
          headerStyle: {
            backgroundColor: "#fff",
            elevation: 1,
            shadowOpacity: 0.1,
          },
        }}
      />
      <Stack.Screen
        name="TodoList"
        component={TodoListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// --- STYLES CHO HEADER ---
const headerStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ff6b9d", // Updated to match tab bar active color
    fontFamily: "serif",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: "#f3f4f6", // Better neutral background color
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AppNavigator;
