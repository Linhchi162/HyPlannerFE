import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Users, Lock } from "lucide-react-native";
import { TopicGroup } from "../service/topicGroupService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

interface TopicGroupCardProps {
  group: TopicGroup;
  onPress: () => void;
  joined?: boolean;
}

export const TopicGroupCard: React.FC<TopicGroupCardProps> = ({
  group,
  onPress,
  joined = false,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {group.coverImage && (
        <Image source={{ uri: group.coverImage }} style={styles.coverImage} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {group.name}
          </Text>
          {!group.isPublic && (
            <Lock size={16} color="#666" style={styles.lockIcon} />
          )}
        </View>

        {group.description && (
          <Text style={styles.description} numberOfLines={2}>
            {group.description}
          </Text>
        )}

        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{group.category}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <Users size={16} color="#666" />
            <Text style={styles.statsText}>
              {group.totalMembers} thành viên
            </Text>
          </View>

          {joined && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Đã tham gia</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: responsiveHeight(2),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverImage: {
    width: "100%",
    height: responsiveHeight(15),
    resizeMode: "cover",
  },
  content: {
    padding: responsiveWidth(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(1),
  },
  name: {
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  lockIcon: {
    marginLeft: responsiveWidth(2),
  },
  description: {
    fontSize: responsiveFont(14),
    color: "#666",
    marginBottom: responsiveHeight(1.5),
    lineHeight: 20,
  },
  categoryContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: 12,
    marginBottom: responsiveHeight(1.5),
  },
  category: {
    fontSize: responsiveFont(12),
    color: "#666",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: responsiveFont(13),
    color: "#666",
    marginLeft: responsiveWidth(1),
  },
  joinedBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: 12,
  },
  joinedText: {
    fontSize: responsiveFont(12),
    color: "#4caf50",
    fontWeight: "600",
  },
});
