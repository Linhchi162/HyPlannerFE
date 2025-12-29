// src/navigation/types.tsx

import { type NavigatorScreenParams } from "@react-navigation/native";
import { Member } from "../store/weddingEventSlice"; // Giả sử Member được export từ đây
import { Template } from "../screens/invitation/InvitationLetterScreen"; // Giả sử Template được export từ đây

// Type này có thể cần được định nghĩa đầy đủ hơn hoặc import từ nơi khác
export type LoveStoryItem = {
  _id?: string;
  title: string;
  time: string;
  content: string;
  image: string;
};

export type WeddingEvent = {
  _id?: string;
  name: string;
  time: string;
  venue: string;
  address: string;
  mapLink?: string;
  image?: string;
  embedMapUrl?: string;
};

export type GuestbookMessage = {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
};

// 2. Cập nhật InvitationData với tất cả các trường từ Mongoose Model
//    Sử dụng '?' để đánh dấu các trường này là tùy chọn (có thể null hoặc undefined)
export type InvitationData = {
  _id: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  aboutCouple?: string;
  youtubeUrl?: string;
  album?: string[];
  loveStory?: LoveStoryItem[];
  events?: WeddingEvent[];
  guestRsvpCount?: number;
  guestbookMessages?: GuestbookMessage[];
  bankAccount?: {
    bankBin: string;
    accountNumber: string;
  };
  // ... thêm các trường khác nếu có
};

// Định nghĩa các màn hình trong Stack Navigator chính
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: {
    email?: string;
    newEmail?: string;
    from?: "register" | "forgot-password" | "change-email";
  };
  ChangePassword: { email: string; token: string };
  PasswordUpdated: undefined;
  InviteOrCreate: undefined;
  Main: NavigatorScreenParams<MainTabParamList>; // Lồng Tab Navigator vào
  Profile: undefined;
  UpgradeAccountScreen: { status?: "success" | "cancelled" } | undefined;
  EditProfileScreen: {
    label: string;
    currentValue: string;
    field: string;
  };
  EditWeddingInfo: { eventId: string };
  InvitationLettersScreen: undefined;
  CreateWeddingSite: { template: Template };
  WebsiteManagement: { invitation: InvitationData };
  EditCoupleInfo: {
    invitation: InvitationData;
    sectionType:
      | "coupleInfo"
      | "album"
      | "loveStory"
      | "events"
      | "youtubeVideo"
      | "bankAccount"; // <-- Thêm vào đây
    title: string;
  };
  PaymentSuccess: undefined;
  PaymentCancelled: undefined;
  BeginScreen: undefined;
  TaskList: { eventId: string };
  BudgetList: undefined;
  AddTask: { phaseId: string; eventId: string };
  EditTask: { taskId: string; eventId: string };
  AddBudget: { groupActivityId: string; eventId: string };
  EditBudget: { activityId: string; eventId: string };
  EditBudgetGroupScreen: { eventId: string };
  AddMember: {
    existingMembers?: Member[];
    onSelect?: (selectedMembers: Member[]) => void;
  };
  AddWeddingInfo: undefined;
  JoinWedding: undefined;
  EditPhaseScreen: { eventId: string; createdAt?: string };
  RoleSelection: undefined;
  ChooseStyle: undefined;
  WeddingDress: undefined;
  Accessories: undefined;
  WeddingMaterial: undefined;
  WeddingNeckline: undefined;
  WeddingDetail: undefined;
  WeddingFlowers: undefined;
  Location: undefined;
  Style: undefined;
  ColorTone: undefined;
  AccessoriesJewelry: undefined;
  AccessoriesHairClip: undefined;
  AccessoriesCrown: undefined;
  Album: undefined;
  AlbumDetail: { album?: any; albumId?: string; source?: "my" | "community" };
  TestCreateAlbum: undefined;
  AlbumWizardComplete: undefined;
  GroomSuit: undefined;
  GroomMaterial: undefined;
  GroomColor: undefined;
  GroomAccessoriesLapel: undefined;
  GroomAccessoriesPocketSquare: undefined;
  GroomAccessoriesDecor: undefined;
  BrideAoDaiStyle: undefined;
  BrideAoDaiMaterial: undefined;
  BrideAoDaiPattern: undefined;
  BrideHeadscarf: undefined;
  GroomEngagementOutfit: undefined;
  GroomEngagementAccessories: undefined;
  WhoIsNextMarried: { member: any[]; creatorId?: string };
  MoodBoards: undefined;
  Notifications: undefined;
  CommunityScreen: undefined;
  PostDetailScreen: { postId: string };
  CreatePostScreen: { postId?: string }; // Optional: for editing existing post
  TopicGroupsScreen: undefined;
  TopicGroupDetailScreen: { groupId: string };
  InspireBoardScreen: undefined;
  CommunityAlbumsScreen: undefined;
  SavedPostsScreen: undefined;
  SavedAlbumsScreen: undefined;
  CreateAlbumScreen: undefined;
  GuestManagementScreen: undefined;
  GuestDetailScreen: { guestId: string };
  NotificationListScreen: { weddingEventId: string };
};

// Định nghĩa các màn hình trong Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  WebsiteTab: undefined;
  Community: undefined;
  MoodBoard: undefined;
  ProfileTab: undefined;
};
