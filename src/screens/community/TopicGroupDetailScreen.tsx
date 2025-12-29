import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Users, UserPlus, UserMinus } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTopicGroupById,
  joinGroup,
  leaveGroup,
} from "../../store/topicGroupSlice";
import * as topicGroupService from "../../service/topicGroupService";
import { PostCard } from "../../components/PostCard";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

export const TopicGroupDetailScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading } = useAppSelector(
    (state) => state.topicGroups
  );
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchTopicGroupById(groupId));
    loadPosts();
  }, [groupId]);

  const loadPosts = async (pageNum = 1) => {
    setPostsLoading(true);
    try {
      const data = await topicGroupService.getTopicGroupPosts(groupId, pageNum);
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!currentGroup) return;

    const isMember = currentGroup.members.includes(currentUserId || "");

    try {
      if (isMember) {
        Alert.alert("Rời nhóm", "Bạn có chắc chắn muốn rời khỏi nhóm này?", [
          { text: "Hủy", style: "cancel" },
          {
            text: "Rời nhóm",
            style: "destructive",
            onPress: async () => {
              await dispatch(leaveGroup(groupId));
              navigation.goBack();
            },
          },
        ]);
      } else {
        await dispatch(joinGroup(groupId));
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error);
    }
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  if (isLoading || !currentGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  const isMember = currentGroup.members.includes(currentUserId || "");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUserId || ""}
            onPress={() => handlePostPress(item._id)}
            onReact={(type) => console.log("React", type)}
            onUnreact={() => console.log("Unreact")}
          />
        )}
        ListHeaderComponent={
          <View>
            {currentGroup.coverImage && (
              <Image
                source={{ uri: currentGroup.coverImage }}
                style={styles.coverImage}
              />
            )}

            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{currentGroup.name}</Text>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{currentGroup.category}</Text>
              </View>

              {currentGroup.description && (
                <Text style={styles.description}>
                  {currentGroup.description}
                </Text>
              )}

              <View style={styles.statsRow}>
                <Users size={20} color="#666" />
                <Text style={styles.statsText}>
                  {currentGroup.totalMembers} thành viên •{" "}
                  {currentGroup.totalPosts} bài viết
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, isMember && styles.leaveButton]}
                onPress={handleJoinLeave}
              >
                {isMember ? (
                  <>
                    <UserMinus size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Rời nhóm</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Tham gia</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>Bài viết trong nhóm</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            </View>
          ) : null
        }
        onEndReached={() => {
          if (!postsLoading) {
            setPage((p) => p + 1);
            loadPosts(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
  },
  coverImage: {
    width: "100%",
    height: responsiveHeight(25),
    resizeMode: "cover",
  },
  groupInfo: {
    backgroundColor: "#fff",
    padding: responsiveWidth(5),
    marginBottom: responsiveHeight(1),
  },
  groupName: {
    fontSize: responsiveFont(24),
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: responsiveHeight(1),
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: 12,
    marginBottom: responsiveHeight(1.5),
  },
  categoryText: {
    fontSize: responsiveFont(13),
    color: "#666",
    fontWeight: "600",
  },
  description: {
    fontSize: responsiveFont(15),
    color: "#666",
    lineHeight: 22,
    marginBottom: responsiveHeight(2),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  statsText: {
    fontSize: responsiveFont(14),
    color: "#666",
    marginLeft: responsiveWidth(2),
  },
  actionButton: {
    backgroundColor: "#e91e63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(1.5),
    borderRadius: 25,
  },
  leaveButton: {
    backgroundColor: "#999",
  },
  actionButtonText: {
    fontSize: responsiveFont(16),
    color: "#fff",
    fontWeight: "600",
    marginLeft: responsiveWidth(2),
  },
  postsHeader: {
    backgroundColor: "#fff",
    padding: responsiveWidth(5),
    marginBottom: responsiveHeight(1),
  },
  postsTitle: {
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#1a1a1a",
  },
  emptyContainer: {
    paddingVertical: responsiveHeight(10),
    alignItems: "center",
  },
  emptyText: {
    fontSize: responsiveFont(16),
    color: "#999",
  },
});
