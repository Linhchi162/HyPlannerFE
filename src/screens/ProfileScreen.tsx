import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator, // <-- Thêm vào
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Thêm vào
import {
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Moon,
  Globe,
  Cake,
  Pencil,
} from "lucide-react-native";

// Bảng màu từ thiết kế
const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#1F2024",
  textSecondary: "#6D6D6D",
  primary: "#F2C4CE",
  iconColor: "#D8707E",
  white: "#FFFFFF",
};

// Component tái sử dụng cho mỗi mục thông tin
type ProfileItemProps = {
  icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  value?: string;
  onPress?: () => void;
};

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  label,
  value,
  onPress,
}) => {
  const IconComponent = icon;
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
        <IconComponent color={COLORS.iconColor} size={20} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemLabel}>{label}</Text>
        {value && <Text style={styles.itemValue}>{value}</Text>}
      </View>
      {onPress && <ChevronRight color={COLORS.textSecondary} size={22} />}
    </TouchableOpacity>
  );
};

// Định nghĩa kiểu dữ liệu cho người dùng
type UserData = {
  fullName: string;
  email: string;
  picture?: string;
};

import type { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Login: undefined;
  // Add other screens here if needed
};

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ===== LOGIC TỪ CODE CŨ =====
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const parsedData = JSON.parse(userDataString);

          // TẠO ĐỐI TƯỢNG MỚI ĐÚNG VỚI TYPE USERDATA
          const mappedUser: UserData = {
            fullName: parsedData.fullName, // Map 'fullName' vào 'fullName'
            email: parsedData.email,
            picture: parsedData.picture,
          };
          setUser(mappedUser); // Set user với dữ liệu đã được map
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu người dùng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("appToken");
    await AsyncStorage.removeItem("userData");
    navigation.navigate("Login");
  };
  // ============================

  // Trạng thái đang tải
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.iconColor} />
      </View>
    );
  }

  // Trạng thái lỗi hoặc không có người dùng
  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Không thể tải thông tin người dùng.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: COLORS.iconColor, marginTop: 10 }}>
            Quay lại đăng nhập
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Giao diện chính khi đã có dữ liệu
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: user.picture || "https://i.pravatar.cc/300" }} // Sử dụng ảnh người dùng hoặc ảnh mặc định
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editButton}>
            <Pencil size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Thẻ thông tin tài khoản */}
        <View style={styles.card}>
          <ProfileItem
            icon={User}
            label="Tên đăng nhập"
            value={user.fullName} // <-- Dữ liệu động
            onPress={() => console.log("Chỉnh sửa tên")}
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Mail}
            label="Email"
            value={user.email} // <-- Dữ liệu động
            onPress={() => console.log("Chỉnh sửa email")}
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Lock}
            label="Mật khẩu"
            value="••••••••"
            onPress={() => console.log("Chỉnh sửa mật khẩu")}
          />
          <View style={styles.separator} />
          <View style={styles.itemContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.primary },
              ]}
            >
              <Moon color={COLORS.iconColor} size={20} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemLabel}>Chế độ tối</Text>
            </View>
            <Switch
              trackColor={{ false: "#E9E9EA", true: COLORS.primary }}
              thumbColor={isDarkMode ? COLORS.iconColor : "#f4f3f4"}
              onValueChange={() =>
                setIsDarkMode((previousState) => !previousState)
              }
              value={isDarkMode}
            />
          </View>
        </View>

        {/* Thẻ thông tin cá nhân */}
        <View style={styles.card}>
          <ProfileItem
            icon={Globe}
            label="Ngôn ngữ"
            value="Việt Nam"
            onPress={() => console.log("Chỉnh sửa ngôn ngữ")}
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Cake}
            label="Ngày sinh"
            value="01/01/2000"
            onPress={() => console.log("Chỉnh sửa ngày sinh")}
          />
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Thêm style cho màn hình loading/error
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editButton: {
    position: "absolute",
    bottom: 5,
    right: "32%",
    backgroundColor: COLORS.iconColor,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  itemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    color: COLORS.iconColor,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
