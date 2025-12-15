import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft, Send } from "lucide-react-native";
import { AppDispatch, RootState } from "../../store";
import {
  fetchPostById,
  reactPost,
  unreactPost,
  deleteExistingPost,
  updatePostCommentCount,
} from "../../store/postSlice";
import {
  fetchCommentsByPost,
  fetchRepliesByComment,
  createNewComment,
  deleteExistingComment,
  reactComment,
  unreactComment,
  updateExistingComment,
} from "../../store/commentSlice";
import { PostCard } from "../../components/PostCard";
import { CommentItem } from "../../components/CommentItem";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { MixpanelService } from "../../service/mixpanelService";

type PostDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "PostDetailScreen"
>;
type PostDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PostDetailScreen"
>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailScreenRouteProp>();
  const navigation = useNavigation<PostDetailScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { postId } = route.params;
  const { currentPost, isLoading } = useSelector(
    (state: RootState) => state.posts
  );
  const { comments } = useSelector((state: RootState) => state.comments);
  const { replies } = useSelector((state: RootState) => state.comments);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || currentUser?._id || "";

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    MixpanelService.track("Viewed Post Detail", { postId });
    dispatch(fetchPostById(postId));
    dispatch(fetchCommentsByPost(postId));
  }, [dispatch, postId]);

  const handleReactPost = (reactionType: "like" | "love") => {
    dispatch(reactPost({ postId, reactionType }));
  };

  const handleUnreactPost = () => {
    dispatch(unreactPost(postId));
  };

  const handleDeletePost = () => {
    Alert.alert("Xóa bài viết", "Bạn có chắc chắn muốn xóa bài viết này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          dispatch(deleteExistingPost(postId));
          navigation.goBack();
        },
      },
    ]);
  };

  const handleEditPost = () => {
    navigation.navigate("CreatePostScreen", { postId });
  };

  const handleSendComment = async () => {
    if (commentText.trim() && !isSendingComment) {
      setIsSendingComment(true);
      try {
        await dispatch(
          createNewComment({
            postId,
            data: {
              content: commentText,
              parentCommentId: replyingTo || undefined,
            },
          })
        );

        // Update post comment count
        dispatch(updatePostCommentCount({ postId, increment: 1 }));

        setCommentText("");
        setReplyingTo(null);
      } catch (error) {
        console.error("Error sending comment:", error);
      } finally {
        setIsSendingComment(false);
      }
    }
  };

  const handleReactComment = (
    commentId: string,
    reactionType: "like" | "love"
  ) => {
    dispatch(reactComment({ commentId, reactionType }));
  };

  const handleUnreactComment = (commentId: string) => {
    dispatch(unreactComment(commentId));
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert("Xóa bình luận", "Bạn có chắc chắn muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          dispatch(deleteExistingComment(commentId));
          // Update post comment count
          dispatch(updatePostCommentCount({ postId, increment: -1 }));
        },
      },
    ]);
  };

  const handleEditComment = (commentId: string, newContent: string) => {
    dispatch(
      updateExistingComment({
        commentId,
        data: { content: newContent },
      })
    );
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleLoadReplies = (commentId: string) => {
    if (loadedReplies.has(commentId)) {
      // Hide replies
      setLoadedReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      // Load replies
      dispatch(fetchRepliesByComment(commentId));
      setLoadedReplies((prev) => new Set(prev).add(commentId));
    }
  };

  if (isLoading || !currentPost) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b9d" />
        <Text style={styles.loadingText}>Đang tải bài viết...</Text>
      </SafeAreaView>
    );
  }

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
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Post and Comments */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(120)
                : responsiveHeight(80),
          }}
        >
          <PostCard
            post={currentPost}
            currentUserId={currentUserId}
            onPress={() => {}}
            onReact={handleReactPost}
            onUnreact={handleUnreactPost}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
          />

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Bình luận</Text>
            {comments.length === 0 ? (
              <Text style={styles.noComments}>
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </Text>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReact={(type) => handleReactComment(comment._id, type)}
                  onUnreact={() => handleUnreactComment(comment._id)}
                  onDelete={() => handleDeleteComment(comment._id)}
                  onEdit={(newContent) =>
                    handleEditComment(comment._id, newContent)
                  }
                  onReply={() => handleReply(comment._id)}
                  onLoadReplies={() => handleLoadReplies(comment._id)}
                  replies={
                    loadedReplies.has(comment._id)
                      ? replies[comment._id]
                      : undefined
                  }
                  onReplyReact={(replyId, type) =>
                    handleReactComment(replyId, type)
                  }
                  onReplyUnreact={(replyId) => handleUnreactComment(replyId)}
                  onReplyDelete={(replyId) => handleDeleteComment(replyId)}
                  onReplyEdit={(replyId, newContent) =>
                    handleEditComment(replyId, newContent)
                  }
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingBanner}>
              <Text style={styles.replyingText}>Đang trả lời bình luận...</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReply}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <Image
              source={{
                uri:
                  currentUser?.picture ||
                  "https://res.cloudinary.com/dz93cdipk/image/upload/v1734248891/default-avatar_qkbbzr.png",
              }}
              style={styles.userAvatar}
            />
            <TextInput
              style={styles.input}
              placeholder={
                replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."
              }
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!commentText.trim() || isSendingComment) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || isSendingComment}
            >
              {isSendingComment ? (
                <ActivityIndicator size="small" color="#ff6b9d" />
              ) : (
                <Send
                  size={20}
                  color={commentText.trim() ? "#ff6b9d" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    marginTop: responsiveHeight(12),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    height: responsiveHeight(64),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
    marginHorizontal: responsiveWidth(8),
  },
  content: {
    flex: 1,
  },
  commentsSection: {
    paddingTop: responsiveHeight(16),
  },
  commentsTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
  },
  noComments: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: responsiveHeight(32),
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    paddingBottom: Platform.OS === "ios" ? responsiveHeight(20) : 0,
  },
  replyingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(8),
    backgroundColor: "#fef3c7",
  },
  replyingText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#92400e",
  },
  cancelReply: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#92400e",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    gap: responsiveWidth(12),
  },
  userAvatar: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
  },
  input: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    backgroundColor: "#f3f4f6",
    borderRadius: responsiveWidth(20),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(8),
    maxHeight: responsiveHeight(100),
  },
  sendButton: {
    padding: responsiveWidth(8),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default PostDetailScreen;
