import apiClient from "../api/client";

export interface Rating {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    picture?: string;
  };
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingData {
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  rating: number;
  review?: string;
}

// Tạo hoặc cập nhật rating
export const createOrUpdateRating = async (
  data: CreateRatingData
): Promise<Rating> => {
  const response = await apiClient.post("/ratings", data);
  return response.data.rating;
};

// Lấy ratings của một item
export const getRatings = async (
  targetType: string,
  targetId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  const response = await apiClient.get(
    `/ratings/${targetType}/${targetId}?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Lấy rating của user cho một item
export const getMyRating = async (
  targetType: string,
  targetId: string
): Promise<any> => {
  const response = await apiClient.get(
    `/ratings/${targetType}/${targetId}/my-rating`
  );
  return response.data;
};

// Xóa rating
export const deleteRating = async (ratingId: string): Promise<void> => {
  await apiClient.delete(`/ratings/${ratingId}`);
};
