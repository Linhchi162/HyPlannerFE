import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Plus, ChevronLeft, Users } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllTopicGroups,
  fetchMyTopicGroups,
} from "../../store/topicGroupSlice";
import { TopicGroupCard } from "../../components/TopicGroupCard";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

export const TopicGroupsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { groups, myGroups, isLoading } = useAppSelector(
    (state: any) => state.topicGroups
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "my">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );

  const categories = [
    "All",
    "Rustic",
    "DIY",
    "Outdoor Photography",
    "Budget Saving",
    "Venue Selection",
    "Dress & Fashion",
    "Decoration",
  ];

  useEffect(() => {
    loadGroups();
  }, [selectedTab, selectedCategory, searchQuery]);

  const loadGroups = () => {
    if (selectedTab === "all") {
      dispatch(
        fetchAllTopicGroups({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: searchQuery || undefined,
        })
      );
    } else {
      dispatch(fetchMyTopicGroups());
    }
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate("TopicGroupDetail", { groupId });
  };

  const handleCreateGroup = () => {
    navigation.navigate("CreateTopicGroup");
  };

  const displayedGroups = selectedTab === "all" ? groups : myGroups;
  const myGroupIds = myGroups.map((g: any) => g._id);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Thread Style */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.logo}>Nhóm</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Kết nối với những người có cùng sở thích
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "all" && styles.activeTab]}
          onPress={() => setSelectedTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "all" && styles.activeTabText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "my" && styles.activeTab]}
          onPress={() => setSelectedTab("my")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "my" && styles.activeTabText,
            ]}
          >
            Của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {selectedTab === "all" && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          style={styles.categoriesList}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                (selectedCategory === item ||
                  (item === "All" && !selectedCategory)) &&
                  styles.activeCategoryChip,
              ]}
              onPress={() =>
                setSelectedCategory(item === "All" ? undefined : item)
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  (selectedCategory === item ||
                    (item === "All" && !selectedCategory)) &&
                    styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Groups List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : (
        <FlatList
          data={displayedGroups}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TopicGroupCard
              group={item}
              onPress={() => handleGroupPress(item._id)}
              joined={myGroupIds.includes(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có nhóm nào</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
        <Plus size={28} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
    paddingBottom: responsiveHeight(12),
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(24),
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(12),
    gap: responsiveWidth(8),
  },
  title: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(22),
    color: "#1f2937",
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(4),
    paddingBottom: responsiveHeight(12),
  },
  createButton: {
    backgroundColor: "#e91e63",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: responsiveWidth(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    gap: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: "#ff6b9d",
    borderColor: "#ff6b9d",
  },
  tabText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  activeTabText: {
    color: "#ffffff",
  },
  categoriesList: {
    maxHeight: responsiveHeight(50),
    marginBottom: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(16),
  },
  categoryChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(12),
    marginRight: responsiveWidth(8),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryChip: {
    backgroundColor: "#ff6b9d",
    borderColor: "#ff6b9d",
  },
  categoryText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#1f2937",
  },
  activeCategoryText: {
    color: "#ffffff",
  },
  listContent: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: responsiveHeight(10),
    alignItems: "center",
  },
  emptyText: {
    fontSize: responsiveFont(16),
    color: "#999",
  },
  fab: {
    position: "absolute",
    right: responsiveWidth(20),
    bottom: responsiveHeight(64),
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    borderRadius: responsiveWidth(28),
    backgroundColor: "#ff6b9d",
    justifyContent: "center",
    alignItems: "center",
  },
});
