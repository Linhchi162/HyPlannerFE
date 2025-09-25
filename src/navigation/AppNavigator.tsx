// --- IMPORTS GIỐNG BẢN TRÊN ---
import { useState, useEffect } from "react";
import { Text, View, Image, StyleSheet, TouchableOpacity } from "react-native";
import {
  NavigationContainer,
  type LinkingOptions,
  useNavigation,
  type NavigatorScreenParams,
} from "@react-navigation/native";
import {
  createStackNavigator,
  type StackNavigationProp,
} from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/authSlice";

// Import các màn hình
import BeginScreen from "../screens/BeginScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import OTPScreen from "../screens/OTPScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import PasswordUpdatedScreen from "../screens/PasswordUpdatedScreen";
import InviteOrCreateScreen from "../screens/InviteOrCreateScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import InvitationLettersScreen from "../screens/InvitationLetterScreen";
import MoodBoardsScreen from "../screens/MoodBoardsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

// ===== IMPORT LẠI ICON USER =====
import { Home, User, Heart, Bell } from "lucide-react-native";
import TaskListScreen from "../screens/TaskListScreen";
import CreateNewTaskScreen from "../screens/CreateNewTaskScreen";
import EditTaskScreen from "../screens/EditTaskScreen";
import AddMemberScreen from "../screens/AddMemberScreen";
import AddWeddingInfo from "../screens/AddWeddingInfo";
import JoinWeddingEvent from "../screens/JoinWeddingEvent";
import { Member } from "../store/weddingEventSlice";
import BudgetListScreen from "../screens/BudgetListScreen";
import CreateNewBudgetScreen from "../screens/CreateNewBudgetScreen";
import EditBudgetScreen from "../screens/EditBudgetScreen";

// ===== THÊM MÀN HÌNH MỚI (giữ format cũ) =====
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import ChooseStyleScreen from "../screens/ChooseStyleScreen";
import WeddingDressScreen from "../screens/WeddingDressScreen";
import WeddingMaterialScreen from "../screens/WeddingMaterialScreen";
import WeddingNecklineScreen from "../screens/WeddingNecklineScreen";
import WeddingDetailScreen from "../screens/WeddingDetailScreen";
import AccessoriesScreen from "../screens/AccessoriesScreen";
import WeddingFlowersScreen from "../screens/WeddingFlowersScreen";
import AccessoriesJewelryScreen from "../screens/AccessoriesJewelryScreen";
import AccessoriesHairClipScreen from "../screens/AccessoriesHairClipScreen";
import AccessoriesCrownScreen from "../screens/AccessoriesCrownScreen";
import AlbumScreen from "../screens/AlbumScreen";
import AlbumDetailScreen from "../screens/AlbumDetailScreen";

const scheme = process.env.EXPO_PUBLIC_SCHEME;

// --- ĐỊNH NGHĨA TYPE (GIỮ NGUYÊN NHƯ TRƯỚC) ---
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: {
    email?: string;
    newEmail?: string;
    // Làm cho tham số 'from' an toàn hơn bằng cách chỉ định các giá trị có thể có
    from?: "register" | "forgot-password" | "change-email";
  };
  ChangePassword: { email: string; token: string };
  PasswordUpdated: undefined;
  InviteOrCreate: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Profile: undefined;
  EditProfileScreen: {
    label: string;
    currentValue: string;
    field: string;
  };
  InvitationLettersScreen: undefined;
  BeginScreen: undefined;
  TaskList: { eventId: string };
  BudgetList: undefined;
  AddTask: { phaseId: string; eventId: string };
  EditTask: { taskId: string; eventId: string };
  AddBudget: { groupActivityId: string; eventId: string };
  EditBudget: { activityId: string; eventId: string };
  AddMember: {
    existingMembers?: Member[];
    onSelect?: (selectedMembers: Member[]) => void;
  };
  AddWeddingInfo: undefined;
  JoinWedding: undefined;

  // ===== THÊM TYPE MÀN HÌNH MỚI =====
  RoleSelection: undefined;
  ChooseStyle: undefined;
  WeddingDress: undefined;
  Accessories: undefined;
  WeddingMaterial: undefined;
  WeddingNeckline: undefined;
  WeddingDetail: undefined;
  WeddingFlowers: undefined;
  AccessoriesJewelry: undefined;
  AccessoriesHairClip: undefined;
  AccessoriesCrown: undefined;
  Album: undefined;
  AlbumDetail: { album: any };
};

// ===== CẬP NHẬT LẠI TYPE CHO TAB =====
export type MainTabParamList = {
  Home: undefined;
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
  const user = useSelector(selectCurrentUser); // <-- Lấy user từ Redux
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const navigateToProfile = () => {
    navigation.navigate("Profile");
  };

  const picture = user?.picture;

  return (
    <TouchableOpacity onPress={navigateToProfile}>
      {picture ? (
        <Image source={{ uri: picture }} style={headerStyles.avatar} />
      ) : (
        <View style={[headerStyles.avatar, { backgroundColor: "#e5e7eb" }]}>
          <User color="#9ca3af" size={24} />
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- COMPONENT TAB NAVIGATOR (GIỮ FORMAT BẢN TRÊN) ---
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate("Album");
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: "Thông báo" }}
      />
      {/* ===== TAB HỒ SƠ GIỐNG BẢN TRÊN ===== */}
      <Tab.Screen
        name="ProfileTab"
        component={DummyComponent} // Sử dụng component rỗng
        options={{ tabBarLabel: "Hồ sơ" }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate("Profile");
          },
        })}
      />
    </Tab.Navigator>
  );
};

// --- CẤU HÌNH LINKING (GIỮ NGUYÊN) ---
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${scheme}://`],
  config: { screens: { Login: "auth" } },
};

// --- NAVIGATOR CHÍNH CỦA APP (GIỮ FORMAT BẢN TRÊN) ---
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
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PasswordUpdated"
        component={PasswordUpdatedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InviteOrCreate"
        component={InviteOrCreateScreen}
        options={{ headerShown: false }}
      />
      {/* ===== THÊM MÀN HÌNH MỚI NHƯNG GIỮ FORMAT ===== */}
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
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

      {/* Profile */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InvitationLettersScreen"
        component={InvitationLettersScreen}
        options={{ headerShown: false }}
      />

      {/* ===== Tasks & Budget ===== */}
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTask"
        component={CreateNewTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BudgetList"
        component={BudgetListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddBudget"
        component={CreateNewBudgetScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditBudget"
        component={EditBudgetScreen}
        options={{ headerShown: false }}
      />

      {/* ===== Members ===== */}
      <Stack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ headerShown: false }}
      />

      {/* ===== Wedding flow / Catalog ===== */}
      <Stack.Screen
        name="AddWeddingInfo"
        component={AddWeddingInfo}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinWedding"
        component={JoinWeddingEvent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChooseStyle"
        component={ChooseStyleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeddingDress"
        component={WeddingDressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Accessories"
        component={AccessoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeddingMaterial"
        component={WeddingMaterialScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeddingNeckline"
        component={WeddingNecklineScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeddingDetail"
        component={WeddingDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeddingFlowers"
        component={WeddingFlowersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccessoriesJewelry"
        component={AccessoriesJewelryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccessoriesHairClip"
        component={AccessoriesHairClipScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccessoriesCrown"
        component={AccessoriesCrownScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Album"
        component={AlbumScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlbumDetail"
        component={AlbumDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// --- STYLES CHO HEADER ---
const headerStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: "Agbalumo",
    color: "#ff6b9d", // Updated to match tab bar active color
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AppNavigator;
