import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Heart, MoreVertical, Trash2, Edit, Send } from "lucide-react-native";
import { Comment } from "../service/commentService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReact: (reactionType: "like" | "love") => void;
  onUnreact: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  onReply?: () => void;
  onLoadReplies?: () => void;
  replies?: Comment[];
  isReply?: boolean;
  onReplyReact?: (replyId: string, reactionType: "like" | "love") => void;
  onReplyUnreact?: (replyId: string) => void;
  onReplyDelete?: (replyId: string) => void;
  onReplyEdit?: (replyId: string, newContent: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReact,
  onUnreact,
  onDelete,
  onEdit,
  onReply,
  onLoadReplies,
  replies,
  isReply = false,
  onReplyReact,
  onReplyUnreact,
  onReplyDelete,
  onReplyEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isMyComment = comment.userId._id === currentUserId;

  // === 🛠️ HÀM KIỂM TRA REACT AN TOÀN (GIỐNG PostCard.tsx) ===
  const checkReacted = (list: any[]) => {
    if (!list) return false;
    return list.some((item) => {
      // Nếu item là object (đã populate) thì lấy ._id, nếu là string thì lấy chính nó
      const itemId =
        typeof item === "object" && item !== null ? item._id : item;
      return itemId?.toString() === currentUserId?.toString();
    });
  };

  // Xác định trạng thái reaction hiện tại
  const userReaction = checkReacted(comment.reactions.like)
    ? "like"
    : checkReacted(comment.reactions.love)
    ? "love"
    : null;

  const handleReactionPress = () => {
    if (userReaction) {
      onUnreact();
    } else {
      onReact("like");
    }
  };

  const handleEditSave = () => {
    if (onEdit && editText.trim() && editText !== comment.content) {
      onEdit(editText);
      setIsEditing(false);
    } else if (editText === comment.content) {
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <Image
        source={{
          uri:
            comment.userId.picture ||
            "https://res.cloudinary.com/dz93cdipk/image/upload/v1734248891/default-avatar_qkbbzr.png",
        }}
        style={styles.avatar}
      />

      <View style={styles.contentContainer}>
        <View style={styles.commentBubble}>
          <View style={styles.header}>
            <Text style={styles.userName}>{comment.userId.fullName}</Text>
            {isMyComment && (
              <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                <MoreVertical size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelButton}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditSave}>
                  <Text style={styles.saveButton}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.commentText}>{comment.content}</Text>
          )}

          {showMenu && isMyComment && (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setIsEditing(true);
                }}
              >
                <Edit size={14} color="#1f2937" />
                <Text style={styles.menuText}>Sửa</Text>
              </TouchableOpacity>
              {onDelete && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={[styles.menuText, { color: "#ef4444" }]}>
                    Xóa
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Text style={styles.timestamp}>{formatDate(comment.createdAt)}</Text>
          <TouchableOpacity onPress={handleReactionPress}>
            <Text
              style={[styles.actionText, userReaction && { color: "#ff6b9d" }]}
            >
              Thích
            </Text>
          </TouchableOpacity>
          {!isReply && onReply && (
            <TouchableOpacity onPress={onReply}>
              <Text style={styles.actionText}>Trả lời</Text>
            </TouchableOpacity>
          )}
          {comment.totalReactions > 0 && (
            <View style={styles.reactionCount}>
              <Heart size={12} color="#ff6b9d" fill="#ff6b9d" />
              <Text style={styles.reactionCountText}>
                {comment.totalReactions}
              </Text>
            </View>
          )}
        </View>

        {/* Show replies button */}
        {!isReply && comment.totalReplies > 0 && onLoadReplies && (
          <TouchableOpacity onPress={onLoadReplies} style={styles.viewReplies}>
            <Text style={styles.viewRepliesText}>
              {replies && replies.length > 0
                ? `Ẩn ${comment.totalReplies} câu trả lời`
                : `Xem ${comment.totalReplies} câu trả lời`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Render replies */}
        {replies && replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                onReact={(type) => onReplyReact?.(reply._id, type)}
                onUnreact={() => onReplyUnreact?.(reply._id)}
                onDelete={() => onReplyDelete?.(reply._id)}
                onEdit={(newContent) => onReplyEdit?.(reply._id, newContent)}
                isReply
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(8),
    gap: responsiveWidth(8),
  },
  replyContainer: {
    paddingLeft: responsiveWidth(24),
  },
  avatar: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
  },
  contentContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: "#f3f4f6",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(4),
  },
  userName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#1f2937",
  },
  commentText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#1f2937",
    lineHeight: responsiveHeight(18),
  },
  menu: {
    position: "absolute",
    top: responsiveHeight(32),
    right: responsiveWidth(8),
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    paddingVertical: responsiveHeight(6),
    paddingHorizontal: responsiveWidth(8),
  },
  menuText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#1f2937",
  },
  editContainer: {
    marginTop: responsiveHeight(8),
  },
  editInput: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(8),
    marginBottom: responsiveHeight(8),
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: responsiveWidth(12),
  },
  cancelButton: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  saveButton: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#ff6b9d",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
    marginTop: responsiveHeight(4),
    paddingLeft: responsiveWidth(8),
  },
  timestamp: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(11),
    color: "#9ca3af",
  },
  actionText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(11),
    color: "#6b7280",
  },
  reactionCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(4),
  },
  reactionCountText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(11),
    color: "#9ca3af",
  },
  viewReplies: {
    paddingLeft: responsiveWidth(8),
    paddingTop: responsiveHeight(6),
  },
  viewRepliesText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  repliesContainer: {
    marginTop: responsiveHeight(8),
  },
});
