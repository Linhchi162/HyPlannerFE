// src/navigation/RootStackNavigator.tsx

import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import * as Linking from "expo-linking";
import { Bell, XCircle } from "lucide-react-native";

// Responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

// Services
import * as notificationService from "../service/notificationService";

// Types và configs đã tách ra
import { RootStackParamList } from "./types";
import { linking } from "./linking";
import { MainTabNavigator } from "./MainTabNavigator";

// Redux
import { selectCurrentUser, selectRememberMe } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserInvitation } from "../store/invitationSlice";
import { RootState } from "../store";

// Import tất cả các màn hình
import BeginScreen from "../screens/auth/BeginScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
// ... (import tất cả các màn hình khác của bạn ở đây)
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OTPScreen from "../screens/auth/OTPScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import PasswordUpdatedScreen from "../screens/auth/PasswordUpdatedScreen";
import InviteOrCreateScreen from "../screens/auth/InviteOrCreateScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import EditWeddingInfoScreen from "../screens/wedding-setup/EditWeddingInfoScreen";
import InvitationLettersScreen from "../screens/invitation/InvitationLetterScreen";
import CreateWeddingSiteScreen from "../screens/invitation/CreateWeddingSiteScreen";
import EditCoupleInfoScreen from "../screens/invitation/EditCoupleInfoScreen";
import WebsiteManagementScreen from "../screens/invitation/WebsiteManagementScreen";
import UpgradeAccountScreen from "../screens/payment/UpgradeAccountScreen";
import PaymentSuccessScreen from "../screens/payment/PaymentSuccessScreen";
import PaymentCancelledScreen from "../screens/payment/PaymentCancelledScreen";
import TaskListScreen from "../screens/tasks/TaskListScreen";
import CreateNewTaskScreen from "../screens/tasks/CreateNewTaskScreen";
import EditTaskScreen from "../screens/tasks/EditTaskScreen";
import AddMemberScreen from "../screens/profile/AddMemberScreen";
import AddWeddingInfo from "../screens/wedding-setup/AddWeddingInfo";
import JoinWeddingEvent from "../screens/wedding-setup/JoinWeddingEvent";
import BudgetListScreen from "../screens/budget/BudgetListScreen";
import CreateNewBudgetScreen from "../screens/budget/CreateNewBudgetScreen";
import EditBudgetScreen from "../screens/budget/EditBudgetScreen";
import EditBudgetGroupScreen from "../screens/budget/EditBudgetGroup/EditBudgetGroupScreen";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import ChooseStyleScreen from "../screens/wedding-setup/ChooseStyleScreen";
import WeddingDressScreen from "../screens/bride/WeddingDressScreen";
import WeddingMaterialScreen from "../screens/bride/WeddingMaterialScreen";
import WeddingNecklineScreen from "../screens/bride/WeddingNecklineScreen";
import WeddingDetailScreen from "../screens/bride/WeddingDetailScreen";
import AccessoriesScreen from "../screens/accessories/AccessoriesScreen";
import WeddingFlowersScreen from "../screens/venue-theme/WeddingFlowersScreen";
import LocationScreen from "../screens/venue-theme/LocationScreen";
import StyleScreen from "../screens/venue-theme/StyleScreen";
import ColorToneScreen from "../screens/venue-theme/ColorToneScreen";
import AccessoriesJewelryScreen from "../screens/accessories/AccessoriesJewelryScreen";
import AccessoriesHairClipScreen from "../screens/accessories/AccessoriesHairClipScreen";
import AccessoriesCrownScreen from "../screens/accessories/AccessoriesCrownScreen";
import AlbumScreen from "../screens/album/AlbumScreen";
import AlbumDetailScreen from "../screens/album/AlbumDetailScreen";
import TestCreateAlbum from "../screens/album/TestCreateAlbum";
import AlbumWizardCompleteScreen from "../screens/album/AlbumWizardCompleteScreen";
import MoodBoardsScreen from "../screens/album/MoodBoardsScreen";
import NotificationsScreen from "../screens/home/NotificationsScreen";
import GroomSuitScreen from "../screens/groom/GroomSuitScreen";
import GroomMaterialScreen from "../screens/groom/GroomMaterialScreen";
import GroomColorScreen from "../screens/groom/GroomColorScreen";
import GroomAccessoriesLapelScreen from "../screens/groom/GroomAccessoriesLapelScreen";
import GroomAccessoriesPocketSquareScreen from "../screens/groom/GroomAccessoriesPocketSquareScreen";
import GroomAccessoriesDecorScreen from "../screens/groom/GroomAccessoriesDecorScreen";
import BrideAoDaiStyleScreen from "../screens/bride/BrideAoDaiStyleScreen";
import BrideAoDaiMaterialScreen from "../screens/bride/BrideAoDaiMaterialScreen";
import BrideAoDaiPatternScreen from "../screens/bride/BrideAoDaiPatternScreen";
import BrideHeadscarfScreen from "../screens/bride/BrideHeadscarfScreen";
import GroomEngagementOutfitScreen from "../screens/groom/GroomEngagementOutfitScreen";
import GroomEngagementAccessoriesScreen from "../screens/groom/GroomEngagementAccessoriesScreen";
import EditPhaseScreen from "../screens/tasks/EditPhase/EditPhaseScreen";
import WhoIsNextMarriedScreen from "../screens/shared/WhoIsNextMarriedScreen";
import CommunityScreen from "../screens/community/CommunityScreen";
import PostDetailScreen from "../screens/community/PostDetailScreen";
import CreatePostScreen from "../screens/community/CreatePostScreen";
import { TopicGroupsScreen } from "../screens/community/TopicGroupsScreen";
import { TopicGroupDetailScreen } from "../screens/community/TopicGroupDetailScreen";
import { InspireBoardScreen } from "../screens/community/InspireBoardScreen";
import CommunityAlbumsScreen from "../screens/community/CommunityAlbumsScreen";
import SavedPostsScreen from "../screens/community/SavedPostsScreen";
import SavedAlbumsScreen from "../screens/community/SavedAlbumsScreen";
import GuestManagementScreen from "../screens/guest/GuestManagementScreen";
import GuestDetailScreen from "../screens/guest/GuestDetailScreen";
import NotificationListScreen from "../screens/guest/NotificationListScreen";

const Stack = createStackNavigator<RootStackParamList>();

// Component HeaderNotification
const HeaderNotification = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={headerStyles.notificationButton}>
        <Bell color="#ff6b9d" size={26} />
      </View>
    </TouchableOpacity>
  );
};

const RootStackNavigator = () => {
  const user = useAppSelector(selectCurrentUser);
  const rememberMe = useAppSelector(selectRememberMe);
  const dispatch = useAppDispatch();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  // Get wedding event for notifications
  const weddingEvent = useAppSelector(
    (state: RootState) => state.weddingEvent?.getWeddingEvent?.weddingEvent
  );

  // Notifications modal state
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Xác định màn hình khởi đầu dựa trên auth state
  const getInitialRouteName = (): keyof RootStackParamList => {
    // Nếu user đã login và có rememberMe, auto-navigate đến Main
    if (user && rememberMe) {
      return "Main";
    }
    // Ngược lại, hiển thị BeginScreen
    return "BeginScreen";
  };

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

  // Fetch notifications when modal opens
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!showNotificationsModal || !weddingEvent?._id) return;

      setLoadingNotifications(true);
      try {
        const response = await notificationService.getNotifications(
          weddingEvent._id,
          { limit: 10 } // Only show 10 most recent in modal
        );
        setNotifications(response.notifications);
      } catch (error: any) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [showNotificationsModal, weddingEvent?._id]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        fallback={<Text>Loading...</Text>}
      >
        <Stack.Navigator initialRouteName={getInitialRouteName()}>
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
              headerRight: () => (
                <HeaderNotification
                  onPress={() => setShowNotificationsModal(true)}
                />
              ),
              headerLeft: () => <View style={{ width: 15 }} />,
              headerTitleAlign: "left",
              headerStyle: {
                backgroundColor: "#fff",
                elevation: 0,
                shadowOpacity: 0,
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
            name="EditWeddingInfo"
            component={EditWeddingInfoScreen}
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
            name="EditBudgetGroupScreen"
            component={EditBudgetGroupScreen}
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
            name="TestCreateAlbum"
            component={TestCreateAlbum}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AlbumWizardComplete"
            component={AlbumWizardCompleteScreen}
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
          {/* Community Screens */}
          <Stack.Screen
            name="CommunityScreen"
            component={CommunityScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostDetailScreen"
            component={PostDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreatePostScreen"
            component={CreatePostScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TopicGroupsScreen"
            component={TopicGroupsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TopicGroupDetailScreen"
            component={TopicGroupDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InspireBoardScreen"
            component={InspireBoardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CommunityAlbumsScreen"
            component={CommunityAlbumsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SavedPostsScreen"
            component={SavedPostsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SavedAlbumsScreen"
            component={SavedAlbumsScreen}
            options={{ headerShown: false }}
          />
          {/* Guest Management Screens */}
          <Stack.Screen
            name="GuestManagementScreen"
            component={GuestManagementScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GuestDetailScreen"
            component={GuestDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationListScreen"
            component={NotificationListScreen}
            options={{ headerShown: false }}
          />
          {/* MoodBoards Screen */}
          <Stack.Screen
            name="MoodBoards"
            component={MoodBoardsScreen}
            options={{ headerShown: false }}
          />
          {/* Notifications Screen */}
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>

        {/* Notifications Modal */}
        <Modal
          visible={showNotificationsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.container}>
              <View style={modalStyles.header}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: responsiveHeight(8),
                    }}
                  >
                    <Text style={modalStyles.title}>Thông báo</Text>
                    <TouchableOpacity
                      onPress={() => setShowNotificationsModal(false)}
                    >
                      <XCircle size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  {weddingEvent?._id && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowNotificationsModal(false);
                        navigationRef.navigate("NotificationListScreen", {
                          weddingEventId: weddingEvent._id,
                        });
                      }}
                    >
                      <Text
                        style={{
                          color: "#ff6b9d",
                          fontSize: responsiveFont(14),
                          fontFamily: "Montserrat-SemiBold",
                        }}
                      >
                        Xem tất cả
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {loadingNotifications ? (
                <View style={modalStyles.loading}>
                  <ActivityIndicator size="large" color="#ff6b9d" />
                  <Text style={modalStyles.loadingText}>Đang tải...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={modalStyles.empty}>
                  <Bell size={48} color="#d1d5db" />
                  <Text style={modalStyles.emptyText}>
                    Không có thông báo mới
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={modalStyles.list}
                  showsVerticalScrollIndicator={true}
                >
                  {notifications.map((notification, index) => (
                    <View key={index} style={modalStyles.item}>
                      <Text style={modalStyles.itemTitle}>
                        {notification.title}
                      </Text>
                      <Text style={modalStyles.itemMessage}>
                        {notification.message}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </NavigationContainer>
    </>
  );
};

const headerStyles = StyleSheet.create({
  title: {
    fontSize: responsiveFont(20),
    fontFamily: "Agbalumo",
    color: "#ff6b9d",
  },
  notificationButton: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(24),
    marginRight: responsiveWidth(15),
    backgroundColor: "#fff5f7",
    borderWidth: 1,
    borderColor: "#ffe4e8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(20),
    borderTopRightRadius: responsiveWidth(20),
    maxHeight: "85%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  loading: {
    padding: responsiveWidth(40),
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    marginTop: responsiveHeight(12),
  },
  empty: {
    padding: responsiveWidth(40),
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#9ca3af",
    marginTop: responsiveHeight(12),
  },
  list: {
    flex: 1,
    padding: responsiveWidth(16),
  },
  item: {
    backgroundColor: "#ffffff",
    padding: responsiveWidth(16),
    borderRadius: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#1f2937",
    marginBottom: responsiveHeight(8),
  },
  itemMessage: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveHeight(22),
  },
});

export default RootStackNavigator;
