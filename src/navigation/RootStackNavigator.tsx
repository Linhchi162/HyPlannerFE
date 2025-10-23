// src/navigation/RootStackNavigator.tsx

import React, { useEffect } from "react";
import { Text, View, Image, StyleSheet, TouchableOpacity } from "react-native";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import * as Linking from "expo-linking";
import { User } from "lucide-react-native";

// Types và configs đã tách ra
import { RootStackParamList } from "./types";
import { linking } from "./linking";
import { MainTabNavigator } from "./MainTabNavigator";

// Redux
import { selectCurrentUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserInvitation } from "../store/invitationSlice";

// Import tất cả các màn hình
import BeginScreen from "../screens/BeginScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
// ... (import tất cả các màn hình khác của bạn ở đây)
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import OTPScreen from "../screens/OTPScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import PasswordUpdatedScreen from "../screens/PasswordUpdatedScreen";
import InviteOrCreateScreen from "../screens/InviteOrCreateScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import InvitationLettersScreen from "../screens/InvitationLetterScreen";
import CreateWeddingSiteScreen from "../screens/CreateWeddingSiteScreen";
import EditCoupleInfoScreen from "../screens/EditCoupleInfoScreen";
import WebsiteManagementScreen from "../screens/WebsiteManagementScreen";
import UpgradeAccountScreen from "../screens/UpgradeAccountScreen";
import PaymentSuccessScreen from "../screens/PaymentSuccessScreen";
import PaymentCancelledScreen from "../screens/PaymentCancelledScreen";
import TaskListScreen from "../screens/TaskListScreen";
import CreateNewTaskScreen from "../screens/CreateNewTaskScreen";
import EditTaskScreen from "../screens/EditTaskScreen";
import AddMemberScreen from "../screens/AddMemberScreen";
import AddWeddingInfo from "../screens/AddWeddingInfo";
import JoinWeddingEvent from "../screens/JoinWeddingEvent";
import BudgetListScreen from "../screens/BudgetListScreen";
import CreateNewBudgetScreen from "../screens/CreateNewBudgetScreen";
import EditBudgetScreen from "../screens/EditBudgetScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import ChooseStyleScreen from "../screens/ChooseStyleScreen";
import WeddingDressScreen from "../screens/WeddingDressScreen";
import WeddingMaterialScreen from "../screens/WeddingMaterialScreen";
import WeddingNecklineScreen from "../screens/WeddingNecklineScreen";
import WeddingDetailScreen from "../screens/WeddingDetailScreen";
import AccessoriesScreen from "../screens/AccessoriesScreen";
import WeddingFlowersScreen from "../screens/WeddingFlowersScreen";
import LocationScreen from "../screens/LocationScreen";
import StyleScreen from "../screens/StyleScreen";
import ColorToneScreen from "../screens/ColorToneScreen";
import AccessoriesJewelryScreen from "../screens/AccessoriesJewelryScreen";
import AccessoriesHairClipScreen from "../screens/AccessoriesHairClipScreen";
import AccessoriesCrownScreen from "../screens/AccessoriesCrownScreen";
import AlbumScreen from "../screens/AlbumScreen";
import AlbumDetailScreen from "../screens/AlbumDetailScreen";
import GroomSuitScreen from "../screens/GroomSuitScreen";
import GroomMaterialScreen from "../screens/GroomMaterialScreen";
import GroomColorScreen from "../screens/GroomColorScreen";
import GroomAccessoriesLapelScreen from "../screens/GroomAccessoriesLapelScreen";
import GroomAccessoriesPocketSquareScreen from "../screens/GroomAccessoriesPocketSquareScreen";
import GroomAccessoriesDecorScreen from "../screens/GroomAccessoriesDecorScreen";
import BrideAoDaiStyleScreen from "../screens/BrideAoDaiStyleScreen";
import BrideAoDaiMaterialScreen from "../screens/BrideAoDaiMaterialScreen";
import BrideAoDaiPatternScreen from "../screens/BrideAoDaiPatternScreen";
import BrideHeadscarfScreen from "../screens/BrideHeadscarfScreen";
import GroomEngagementOutfitScreen from "../screens/GroomEngagementOutfitScreen";
import GroomEngagementAccessoriesScreen from "../screens/GroomEngagementAccessoriesScreen";
import EditPhaseScreen from "../screens/EditPhase/EditPhaseScreen";
import WhoIsNextMarriedScreen from "src/screens/WhoIsNextMarriedScreen";

const Stack = createStackNavigator<RootStackParamList>();

// Component HeaderAvatar
const HeaderAvatar = ({
  navigation,
}: {
  navigation: StackNavigationProp<RootStackParamList>;
}) => {
  const user = useAppSelector(selectCurrentUser);
  const picture = user?.picture;

  return (
    <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
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

const RootStackNavigator = () => {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url || !navigationRef.isReady()) return;
      const { path, queryParams } = Linking.parse(url);
      if (path === "upgrade-account" && queryParams) {
        navigationRef.navigate("UpgradeAccountScreen", queryParams);
      }
    };
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleDeepLink(url)
    );
    return () => subscription.remove();
  }, [navigationRef]);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserInvitation());
    }
  }, [user, dispatch]);

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      fallback={<Text>Loading...</Text>}
    >
      <Stack.Navigator initialRouteName="BeginScreen">
        {/* Các màn hình Auth & Onboarding */}
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
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />

        {/* Màn hình chính chứa Tab Navigator */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={({ navigation }) => ({
            headerTitle: "Hỷ Planner",
            headerTitleStyle: headerStyles.title,
            headerRight: () => <HeaderAvatar navigation={navigation} />,
            headerLeft: () => <View style={{ width: 15 }} />,
            headerTitleAlign: "left",
            headerStyle: {
              backgroundColor: "#fff",
              elevation: 1,
              shadowOpacity: 0.1,
            },
          })}
        />

        {/* Các màn hình khác */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UpgradeAccountScreen"
          component={UpgradeAccountScreen}
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
        <Stack.Screen
          name="CreateWeddingSite"
          component={CreateWeddingSiteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WebsiteManagement"
          component={WebsiteManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditCoupleInfo"
          component={EditCoupleInfoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentCancelled"
          component={PaymentCancelledScreen}
          options={{ headerShown: false }}
        />

        {/* ...Thêm tất cả các Stack.Screen còn lại của bạn vào đây... */}
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
        <Stack.Screen
          name="EditPhaseScreen"
          component={EditPhaseScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddMember"
          component={AddMemberScreen}
          options={{ headerShown: false }}
        />
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
          name="Location"
          component={LocationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Style"
          component={StyleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ColorTone"
          component={ColorToneScreen}
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
        <Stack.Screen
          name="BrideAoDaiStyle"
          component={BrideAoDaiStyleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BrideAoDaiMaterial"
          component={BrideAoDaiMaterialScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BrideAoDaiPattern"
          component={BrideAoDaiPatternScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BrideHeadscarf"
          component={BrideHeadscarfScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomEngagementOutfit"
          component={GroomEngagementOutfitScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomEngagementAccessories"
          component={GroomEngagementAccessoriesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomSuit"
          component={GroomSuitScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomMaterial"
          component={GroomMaterialScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomColor"
          component={GroomColorScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomAccessoriesLapel"
          component={GroomAccessoriesLapelScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomAccessoriesPocketSquare"
          component={GroomAccessoriesPocketSquareScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroomAccessoriesDecor"
          component={GroomAccessoriesDecorScreen}
          options={{ headerShown: false }}
        />
        {/* Who is next married screen */}
        <Stack.Screen
          name="WhoIsNextMarried"
          component={WhoIsNextMarriedScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const headerStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: "Agbalumo",
    color: "#ff6b9d",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: "#f3f4f6",
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

export default RootStackNavigator;
