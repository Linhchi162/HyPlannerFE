import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft, Bookmark } from "lucide-react-native";
import { AppDispatch, RootState } from "../../store";
import { fetchSavedPosts } from "../../store/savedPostSlice";
import { reactPost, unreactPost } from "../../store/postSlice";
import { PostCard } from "../../components/PostCard";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

type SavedPostsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SavedPostsScreen"
>;

const SavedPostsScreen = () => {
  const navigation = useNavigation<SavedPostsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { savedPosts, isLoading } = useSelector(
    (state: RootState) => state.savedPosts
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId =
    currentUser?._id?.toString() || currentUser?.id?.toString() || "";

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSavedPosts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchSavedPosts({ page: 1, limit: 20 }));
    setRefreshing(false);
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate("PostDetailScreen", { postId });
  };

  const handleReact = (postId: string, reactionType: "like" | "love") => {
    dispatch(reactPost({ postId, reactionType }));
  };

  const handleUnreact = (postId: string) => {
    dispatch(unreactPost(postId));
  };

  const renderPost = ({ item }: any) => {
    const post = item.postId; // savedPost.postId chứa thông tin post đã populate
    if (!post || !post._id) return null;

    return (
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onPress={() => handlePostPress(post._id)}
        onReact={(type) => handleReact(post._id, type)}
        onUnreact={() => handleUnreact(post._id)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bài viết đã lưu</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Posts List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffc107" />
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#ffc107"]}
              tintColor="#ffc107"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bookmark size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Chưa có bài viết đã lưu</Text>
              <Text style={styles.emptyText}>
                Lưu những bài viết yêu thích để xem lại sau
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  listContent: {
    paddingBottom: responsiveHeight(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(100),
    paddingHorizontal: responsiveWidth(32),
  },
  emptyTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginTop: responsiveHeight(16),
    marginBottom: responsiveHeight(8),
  },
  emptyText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    textAlign: "center",
  },
});

export default SavedPostsScreen;
