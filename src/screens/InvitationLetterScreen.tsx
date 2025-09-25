import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Image,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { NavigationProp, useNavigation } from "@react-navigation/core";

// Dữ liệu mẫu với URL hình ảnh ngang
const weddingTemplates = [
  {
    id: 1,
    type: "VIP",
    image: "https://omni.vn/wp-content/uploads/2024/11/hinh-dam-cuoi-2.jpg",
  },
  {
    id: 2,
    type: "Miễn phí",
    image: "https://omni.vn/wp-content/uploads/2024/11/hinh-dam-cuoi-2.jpg",
  },
  {
    id: 3,
    type: "Miễn phí",
    image: "https://omni.vn/wp-content/uploads/2024/11/hinh-dam-cuoi-2.jpg",
  },
  {
    id: 4,
    type: "VIP",
    image: "https://omni.vn/wp-content/uploads/2024/11/hinh-dam-cuoi-2.jpg",
  },
];

// Định nghĩa kiểu dữ liệu cho một template
type Template = (typeof weddingTemplates)[0];

// Component Card cho từng mẫu thiệp
const TemplateCard = ({ template }: { template: Template }) => (
  <View style={styles.card}>
    <View style={styles.cardImageContainer}>
      <Image
        source={{ uri: template.image }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {/* Badge VIP/Miễn phí */}
      <View style={styles.badgeContainer}>
        <Text
          style={[
            styles.badgeText,
            template.type === "VIP" ? styles.vipBadge : styles.freeBadge,
          ]}
        >
          {template.type}
        </Text>
      </View>
    </View>

    {/* Các nút hành động */}
    <View style={styles.buttonRow}>
      <TouchableOpacity style={[styles.button, styles.outlineButton]}>
        <Text style={[styles.buttonText, styles.outlineButtonText]}>
          Mẫu thử
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.primaryButton]}>
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          Sử dụng
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function WeddingInvitationsScreen() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const filteredTemplates = weddingTemplates.filter((template) => {
    if (activeTab === "Tất cả") return true;
    return template.type === activeTab;
  });

  const renderHeader = () => (
    <View style={styles.filterTabsContainer}>
      {["Tất cả", "Miễn phí", "VIP"].map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[
            styles.tabButton,
            activeTab === tab ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thiệp cưới</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Danh sách các mẫu thiệp */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TemplateCard template={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    marginTop: StatusBar.currentHeight || 0,
    backgroundColor: "#f4d7ddff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  filterTabsContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#e07181",
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
  },
  activeTabText: {
    color: "#ffffff",
  },
  inactiveTabText: {
    color: "#4b5563",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
    borderColor: "#ddd8d8ff",
    borderWidth: 1,
  },
  cardImageContainer: {
    height: 225,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  badgeText: {
    fontFamily: "Montserrat-Medium",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    overflow: "hidden",
  },
  vipBadge: {
    backgroundColor: "#e07181",
  },
  freeBadge: {
    backgroundColor: "#366d4a",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButton: {
    backgroundColor: "#f3f4f6",
  },
  primaryButton: {
    backgroundColor: "#e07181",
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButtonText: {
    color: "#4b5563",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
});
