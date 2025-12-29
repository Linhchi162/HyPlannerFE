import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Star } from "lucide-react-native";
import * as ratingService from "../service/ratingService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../assets/styles/utils/responsive";

interface RatingButtonProps {
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  onRatingChange?: (averageRating: number) => void;
  showAverage?: boolean;
}

export const RatingButton: React.FC<RatingButtonProps> = ({
  targetId,
  targetType,
  onRatingChange,
  showAverage = true,
}) => {
  const [myRating, setMyRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRatingData();
  }, [targetId]);

  const loadRatingData = async () => {
    try {
      const myRatingData = await ratingService.getMyRating(
        targetType,
        targetId
      );
      setMyRating(myRatingData.rating?.rating || 0);

      if (showAverage) {
        const ratingsData = await ratingService.getRatings(
          targetType,
          targetId,
          1,
          1
        );
        setAverageRating(ratingsData.averageRating || 0);
      }
    } catch (error) {
      console.error("Error loading rating data:", error);
    }
  };

  const handleRate = async (rating: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await ratingService.createOrUpdateRating({
        targetId,
        targetType,
        rating,
      });

      setMyRating(rating);

      if (onRatingChange) {
        const ratingsData = await ratingService.getRatings(
          targetType,
          targetId,
          1,
          1
        );
        onRatingChange(ratingsData.averageRating || 0);
        setAverageRating(ratingsData.averageRating || 0);
      }
    } catch (error) {
      console.error("Error rating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRate(star)}
            disabled={isLoading}
          >
            <Star
              size={24}
              color={star <= myRating ? "#ffc107" : "#e0e0e0"}
              fill={star <= myRating ? "#ffc107" : "transparent"}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>

      {showAverage && averageRating > 0 && (
        <Text style={styles.averageText}>{averageRating.toFixed(1)} ⭐</Text>
      )}

      {isLoading && <ActivityIndicator size="small" color="#ffc107" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    marginHorizontal: responsiveWidth(0.5),
  },
  averageText: {
    fontSize: responsiveFont(14),
    color: "#666",
    marginLeft: responsiveWidth(2),
    fontWeight: "600",
  },
});
