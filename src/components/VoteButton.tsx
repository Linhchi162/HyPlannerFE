import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ThumbsUp, ThumbsDown } from "lucide-react-native";
import * as voteService from "../service/voteService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

interface VoteButtonProps {
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  onVoteChange?: (totalVotes: number) => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  targetId,
  targetType,
  onVoteChange,
}) => {
  const [voteStatus, setVoteStatus] = useState<{
    voted: boolean;
    voteType: "upvote" | "downvote" | null;
  }>({ voted: false, voteType: null });
  const [voteCount, setVoteCount] = useState({
    upvotes: 0,
    downvotes: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVoteData();
  }, [targetId]);

  const loadVoteData = async () => {
    try {
      const [status, count] = await Promise.all([
        voteService.getUserVoteStatus(targetType, targetId),
        voteService.getVoteCount(targetType, targetId),
      ]);
      setVoteStatus(status);
      setVoteCount(count);
    } catch (error) {
      console.error("Error loading vote data:", error);
    }
  };

  const handleVote = async (type: "upvote" | "downvote") => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await voteService.createVote({
        targetId,
        targetType,
        voteType: type,
      });

      // Cập nhật local state dựa trên action
      if (result.action === "removed") {
        setVoteStatus({ voted: false, voteType: null });
        setVoteCount((prev) => ({
          ...prev,
          [type === "upvote" ? "upvotes" : "downvotes"]:
            prev[type === "upvote" ? "upvotes" : "downvotes"] - 1,
          total: prev.total + (type === "upvote" ? -1 : 1),
        }));
      } else if (result.action === "changed") {
        setVoteStatus({ voted: true, voteType: type });
        const oldType = type === "upvote" ? "downvote" : "upvote";
        setVoteCount((prev) => ({
          ...prev,
          [type === "upvote" ? "upvotes" : "downvotes"]:
            prev[type === "upvote" ? "upvotes" : "downvotes"] + 1,
          [oldType === "upvote" ? "upvotes" : "downvotes"]:
            prev[oldType === "upvote" ? "upvotes" : "downvotes"] - 1,
          total: prev.total + (type === "upvote" ? 2 : -2),
        }));
      } else {
        setVoteStatus({ voted: true, voteType: type });
        setVoteCount((prev) => ({
          ...prev,
          [type === "upvote" ? "upvotes" : "downvotes"]:
            prev[type === "upvote" ? "upvotes" : "downvotes"] + 1,
          total: prev.total + (type === "upvote" ? 1 : -1),
        }));
      }

      if (onVoteChange) {
        const newTotal = await voteService.getVoteCount(targetType, targetId);
        onVoteChange(newTotal.total);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.voteButton,
          voteStatus.voteType === "upvote" && styles.upvoteActive,
        ]}
        onPress={() => handleVote("upvote")}
        disabled={isLoading}
      >
        {isLoading && voteStatus.voteType === "upvote" ? (
          <ActivityIndicator size="small" color="#4caf50" />
        ) : (
          <>
            <ThumbsUp
              size={20}
              color={voteStatus.voteType === "upvote" ? "#4caf50" : "#666"}
            />
            <Text
              style={[
                styles.voteText,
                voteStatus.voteType === "upvote" && styles.upvoteTextActive,
              ]}
            >
              {voteCount.upvotes}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>{voteCount.total}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.voteButton,
          voteStatus.voteType === "downvote" && styles.downvoteActive,
        ]}
        onPress={() => handleVote("downvote")}
        disabled={isLoading}
      >
        {isLoading && voteStatus.voteType === "downvote" ? (
          <ActivityIndicator size="small" color="#f44336" />
        ) : (
          <>
            <ThumbsDown
              size={20}
              color={voteStatus.voteType === "downvote" ? "#f44336" : "#666"}
            />
            <Text
              style={[
                styles.voteText,
                voteStatus.voteType === "downvote" && styles.downvoteTextActive,
              ]}
            >
              {voteCount.downvotes}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.5),
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: 16,
  },
  upvoteActive: {
    backgroundColor: "#e8f5e9",
  },
  downvoteActive: {
    backgroundColor: "#ffebee",
  },
  voteText: {
    fontSize: responsiveFont(13),
    color: "#666",
    marginLeft: responsiveWidth(1),
    fontWeight: "600",
  },
  upvoteTextActive: {
    color: "#4caf50",
  },
  downvoteTextActive: {
    color: "#f44336",
  },
  totalContainer: {
    marginHorizontal: responsiveWidth(2),
  },
  totalText: {
    fontSize: responsiveFont(16),
    fontWeight: "700",
    color: "#1a1a1a",
  },
});
