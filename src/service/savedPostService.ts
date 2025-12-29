import apiClient from "../api/client";

export interface SavedPost {
  _id: string;
  userId: string;
  postId: any; // Populated Post object
  albumId?: {
    _id: string;
    name: string;
  };
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavePostData {
  postId: string;
  albumId?: string;
  note?: string;
}

export interface UpdateSavedPostData {
  albumId?: string;
  note?: string;
}

// Lưu post
export const savePost = async (data: SavePostData): Promise<SavedPost> => {
  const response = await apiClient.post("/saved-posts", data);
  return response.data.savedPost;
};

// Bỏ lưu post
export const unsavePost = async (postId: string): Promise<void> => {
  await apiClient.delete(`/saved-posts/${postId}`);
};

// Lấy danh sách posts đã lưu
export const getSavedPosts = async (
  page: number = 1,
  limit: number = 20,
  albumId?: string
): Promise<any> => {
  let url = `/saved-posts?page=${page}&limit=${limit}`;
  if (albumId) url += `&albumId=${albumId}`;

  const response = await apiClient.get(url);
  return response.data;
};

// Kiểm tra post đã được lưu chưa
export const checkPostSaved = async (postId: string): Promise<any> => {
  const response = await apiClient.get(`/saved-posts/check/${postId}`);
  return response.data;
};

// Cập nhật saved post
export const updateSavedPost = async (
  savedPostId: string,
  data: UpdateSavedPostData
): Promise<SavedPost> => {
  const response = await apiClient.put(`/saved-posts/${savedPostId}`, data);
  return response.data.savedPost;
};
