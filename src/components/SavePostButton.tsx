import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Bookmark } from "lucide-react-native";
import * as savedPostService from "../service/savedPostService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

interface SavePostButtonProps {
  postId: string;
  onSaveChange?: (saved: boolean) => void;
  showText?: boolean;
}

export const SavePostButton: React.FC<SavePostButtonProps> = ({
  postId,
  onSaveChange,
  showText = false,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSavedStatus();
  }, [postId]);

  const checkSavedStatus = async () => {
    try {
      const data = await savedPostService.checkPostSaved(postId);
      setIsSaved(data.saved);
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const handleToggleSave = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isSaved) {
        await savedPostService.unsavePost(postId);
        setIsSaved(false);
        onSaveChange?.(false);
      } else {
        await savedPostService.savePost({ postId });
        setIsSaved(true);
        onSaveChange?.(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleToggleSave}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#6b7280" />
      ) : (
        <>
          <Bookmark
            size={20}
            color={isSaved ? "#ffc107" : "#6b7280"}
            fill={isSaved ? "#ffc107" : "none"}
          />
          <Text style={[styles.text, isSaved && styles.savedText]}>Lưu</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    flex: 1,
    justifyContent: "center",
    paddingVertical: responsiveHeight(8),
  },
  text: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
  },
  savedText: {
    color: "#ffc107",
  },
});
