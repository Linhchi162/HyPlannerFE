import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
} from "react-native";
// ✅ OPTIMIZED: Use expo-image for better caching and performance
import { Image } from "expo-image";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Edit,
  Bookmark,
} from "lucide-react-native";
import { Post } from "../service/postService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";
import { ImageViewer } from "./ImageViewer";
import { SavePostButton } from "./SavePostButton";

const { width } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onPress: () => void;
  onReact: (reactionType: "like" | "love") => void;
  onUnreact: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

// ✅ OPTIMIZED: Wrap with React.memo to prevent unnecessary re-renders
const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onPress,
  onReact,
  onUnreact,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // So sánh ID an toàn bằng toString()
  const isMyPost = post.userId?._id?.toString() === currentUserId?.toString();

  // === 🛠️ HÀM KIỂM TRA REACT AN TOÀN (FIX LỖI KHÔNG HIỆN LIKE) ===
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
  const userReaction = checkReacted(post.reactions.like)
    ? "like"
    : checkReacted(post.reactions.love)
    ? "love"
    : null;

  const handleReactionPress = () => {
    if (userReaction) {
      onUnreact();
    } else {
      onReact("like");
    }
  };

  // ✅ OPTIMIZED: Memoize date formatting to avoid recalculation on every render
  const formattedDate = useMemo(() => {
    const date = new Date(post.createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  }, [post.createdAt]);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setViewerVisible(true);
  };

  // Render images theo layout thông minh
  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageCount = post.images.length;

    if (imageCount === 1) {
      // 1 ảnh: Full width
      return (
        <TouchableOpacity
          onPress={() => handleImagePress(0)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: post.images[0] }}
            style={styles.singleImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        </TouchableOpacity>
      );
    } else if (imageCount === 2) {
      // 2 ảnh: 2 cột
      return (
        <View style={styles.twoImagesContainer}>
          {post.images.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleImagePress(idx)}
              activeOpacity={0.9}
              style={styles.halfImageWrapper}
            >
              <Image
                source={{ uri: img }}
                style={styles.halfImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (imageCount === 3) {
      // 3 ảnh: 1 lớn bên trái, 2 nhỏ bên phải
      return (
        <View style={styles.threeImagesContainer}>
          <TouchableOpacity
            onPress={() => handleImagePress(0)}
            activeOpacity={0.9}
            style={styles.threeImagesLeft}
          >
            <Image
              source={{ uri: post.images[0] }}
              style={styles.threeImagesLargeImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </TouchableOpacity>
          <View style={styles.threeImagesRight}>
            {post.images.slice(1, 3).map((img, idx) => (
              <TouchableOpacity
                key={idx + 1}
                onPress={() => handleImagePress(idx + 1)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: img }}
                  style={styles.threeImagesSmallImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else if (imageCount === 4) {
      // 4 ảnh: Grid 2x2
      return (
        <View style={styles.fourImagesContainer}>
          {post.images.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleImagePress(idx)}
              activeOpacity={0.9}
              style={styles.gridImageWrapper}
            >
              <Image
                source={{ uri: img }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    } else {
      // 5+ ảnh: Grid 2x2 + overlay "+N"
      return (
        <View style={styles.fourImagesContainer}>
          {post.images.slice(0, 4).map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleImagePress(idx)}
              activeOpacity={0.9}
              style={styles.gridImageWrapper}
            >
              <Image
                source={{ uri: img }}
                style={styles.gridImage}
                resizeMode="cover"
              />
              {idx === 3 && imageCount > 4 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>+{imageCount - 4}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri:
                post.userId?.picture ||
                "https://res.cloudinary.com/dz93cdipk/image/upload/v1734248891/default-avatar_qkbbzr.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>
              {post.userId?.fullName || "Người dùng ẩn danh"}
            </Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
        {isMyPost && (
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
            <MoreVertical size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Menu */}
      {showMenu && isMyPost && (
        <View style={styles.menu}>
          {onEdit && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onEdit();
              }}
            >
              <Edit size={16} color="#1f2937" />
              <Text style={styles.menuText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDelete();
              }}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.menuText, { color: "#ef4444" }]}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Text style={styles.content}>
          {post.content.split(/\s+/).map((word, index) => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(word)) {
              return (
                <Text
                  key={index}
                  style={styles.linkText}
                  onPress={(e) => {
                    e.stopPropagation();
                    Linking.openURL(word).catch((err) =>
                      console.error("Failed to open URL:", err)
                    );
                  }}
                >
                  {word}{" "}
                </Text>
              );
            }
            return word + " ";
          })}
        </Text>
      </TouchableOpacity>

      {/* Images with smart layout */}
      {renderImages()}

      {/* Image Viewer Modal */}
      <ImageViewer
        visible={viewerVisible}
        images={post.images || []}
        initialIndex={selectedImageIndex}
        onClose={() => setViewerVisible(false)}
      />

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {post.totalReactions > 0 && `${post.totalReactions} cảm xúc`}
        </Text>
        <Text style={styles.statsText}>
          {post.totalComments > 0 && `${post.totalComments} bình luận`}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleReactionPress}
        >
          <Heart
            size={20}
            color={userReaction ? "#ff6b9d" : "#6b7280"}
            fill={userReaction ? "#ff6b9d" : "none"}
          />
          <Text
            style={[styles.actionText, userReaction && { color: "#ff6b9d" }]}
          >
            Thích
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <MessageCircle size={20} color="#6b7280" />
          <Text style={styles.actionText}>Bình luận</Text>
        </TouchableOpacity>

        <SavePostButton postId={post._id} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    marginBottom: responsiveHeight(8),
    paddingVertical: responsiveHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
  },
  avatar: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
  },
  userName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  timestamp: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#9ca3af",
  },
  menu: {
    position: "absolute",
    top: responsiveHeight(40),
    right: responsiveWidth(16),
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(8),
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
    gap: responsiveWidth(8),
    paddingVertical: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(12),
  },
  menuText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  content: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    lineHeight: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
  },
  linkText: {
    color: "#3b82f6",
    textDecorationLine: "underline",
    fontFamily: "Montserrat-SemiBold",
  },
  // === Styles cho ảnh đơn ===
  singleImage: {
    width: width - responsiveWidth(32),
    height: width - responsiveWidth(32),
    borderRadius: responsiveWidth(12),
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
  },
  // === Styles cho 2 ảnh ===
  twoImagesContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    gap: responsiveWidth(4),
  },
  halfImageWrapper: {
    flex: 1,
  },
  halfImage: {
    width: "100%",
    height: (width - responsiveWidth(36)) / 2,
    borderRadius: responsiveWidth(8),
  },
  // === Styles cho 3 ảnh ===
  threeImagesContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    gap: responsiveWidth(4),
    height: (width - responsiveWidth(32)) * 0.6,
  },
  threeImagesLeft: {
    flex: 2,
  },
  threeImagesLargeImage: {
    width: "100%",
    height: "100%",
    borderRadius: responsiveWidth(8),
  },
  threeImagesRight: {
    flex: 1,
    gap: responsiveWidth(4),
  },
  threeImagesSmallImage: {
    width: "100%",
    height: "49%",
    borderRadius: responsiveWidth(8),
  },
  // === Styles cho 4+ ảnh (Grid 2x2) ===
  fourImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    gap: responsiveWidth(4),
  },
  gridImageWrapper: {
    width: (width - responsiveWidth(36)) / 2,
    height: (width - responsiveWidth(36)) / 2,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: responsiveWidth(8),
  },
  moreImagesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: responsiveWidth(8),
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesText: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(32),
    color: "#ffffff",
  },
  imageScrollView: {
    marginBottom: responsiveHeight(12),
  },
  postImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: responsiveWidth(12),
    marginLeft: responsiveWidth(16),
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(8),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  statsText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
    gap: responsiveWidth(16),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    flex: 1,
    justifyContent: "center",
    paddingVertical: responsiveHeight(8),
  },
  actionText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
  },
});

// ✅ OPTIMIZED: Export memoized component to prevent unnecessary re-renders
export const PostCard = React.memo(PostCardComponent);
