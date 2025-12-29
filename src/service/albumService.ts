import apiClient from "../api/client";

export interface Album {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    picture?: string;
    email?: string;
  };
  name: string;
  authorName?: string;
  coverImage?: string;
  selections: any[];
  images?: string[];
  description?: string;
  note?: string;
  isPublic: boolean;
  totalVotes: number;
  totalSaves: number;
  averageRating: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumData {
  name: string;
  authorName?: string;
  coverImage?: string;
  selections?: string[];
  images?: string[];
  description?: string;
  note?: string;
  isPublic?: boolean;
}

export interface UpdateAlbumData {
  name?: string;
  authorName?: string;
  coverImage?: string;
  selections?: string[];
  images?: string[];
  description?: string;
  note?: string;
  isPublic?: boolean;
}

// Lấy tất cả albums công khai
export const getAllAlbums = async (
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const response = await apiClient.get(`/albums?page=${page}&limit=${limit}`);
  return response.data;
};

// Lấy albums của user hiện tại
export const getMyAlbums = async (): Promise<Album[]> => {
  const response = await apiClient.get("/albums/my-albums");
  return response.data.albums;
};

// Lấy albums công khai của user hiện tại (đã đăng lên cộng đồng)
export const getMyPublicAlbums = async (): Promise<Album[]> => {
  const response = await apiClient.get("/albums/my-public-albums");
  return response.data.albums;
};

// Lấy featured albums (Inspire Board)
export const getFeaturedAlbums = async (
  limit: number = 10
): Promise<Album[]> => {
  const response = await apiClient.get(`/albums/featured?limit=${limit}`);
  return response.data.albums;
};

// Lấy trending albums (albums hot trong tuần)
export const getTrendingAlbums = async (
  limit: number = 10,
  days: number = 7
): Promise<Album[]> => {
  const response = await apiClient.get(
    `/albums/trending?limit=${limit}&days=${days}`
  );
  return response.data.albums;
};

// Lấy album theo ID
export const getAlbumById = async (albumId: string): Promise<Album> => {
  const response = await apiClient.get(`/albums/${albumId}`);
  return response.data.album;
};

// Tạo album mới
export const createAlbum = async (data: CreateAlbumData): Promise<Album> => {
  const response = await apiClient.post("/albums", data);
  return response.data.album;
};

// Cập nhật album
export const updateAlbum = async (
  albumId: string,
  data: UpdateAlbumData
): Promise<Album> => {
  const response = await apiClient.put(`/albums/${albumId}`, data);
  return response.data.album;
};

// Xóa album
export const deleteAlbum = async (albumId: string): Promise<void> => {
  await apiClient.delete(`/albums/${albumId}`);
};

// Đăng album lên cộng đồng
export const publishAlbum = async (
  albumId: string,
  isPublic: boolean = true
): Promise<Album> => {
  const response = await apiClient.put(`/albums/${albumId}/publish`, {
    isPublic,
  });
  return response.data.album;
};

// Thêm selection vào album
export const addSelectionToAlbum = async (
  albumId: string,
  selectionId: string
): Promise<Album> => {
  const response = await apiClient.post(`/albums/${albumId}/add-selection`, {
    selectionId,
  });
  return response.data.album;
};

// Xóa selection khỏi album
export const removeSelectionFromAlbum = async (
  albumId: string,
  selectionId: string
): Promise<Album> => {
  const response = await apiClient.post(`/albums/${albumId}/remove-selection`, {
    selectionId,
  });
  return response.data.album;
};

// Lấy danh sách albums đã lưu (Saved Albums)
export const getSavedAlbums = async (): Promise<any[]> => {
  const response = await apiClient.get("/albums/saved");
  return response.data;
};

// Like album
export const likeAlbum = async (
  albumId: string
): Promise<{ totalVotes: number }> => {
  const response = await apiClient.post(`/albums/${albumId}/like`);
  return response.data;
};

// Unlike album
export const unlikeAlbum = async (
  albumId: string
): Promise<{ totalVotes: number }> => {
  const response = await apiClient.delete(`/albums/${albumId}/like`);
  return response.data;
};

// Save album
export const saveAlbum = async (
  albumId: string
): Promise<{ totalSaves: number }> => {
  const response = await apiClient.post(`/albums/${albumId}/save`);
  return response.data;
};

// Unsave album
export const unsaveAlbum = async (
  albumId: string
): Promise<{ totalSaves: number }> => {
  const response = await apiClient.delete(`/albums/${albumId}/save`);
  return response.data;
};

// Check if user liked/saved album
export const checkAlbumInteraction = async (
  albumId: string
): Promise<{ isLiked: boolean; isSaved: boolean }> => {
  const response = await apiClient.get(`/albums/${albumId}/check-interaction`);
  return response.data;
};

// Generate share code for album
export const generateShareCode = async (
  albumId: string
): Promise<{ success: boolean; shareCode: string; message: string }> => {
  const response = await apiClient.post(
    `/albums/${albumId}/generate-share-code`
  );
  return response.data;
};

// Clone album by share code
export const cloneAlbumByCode = async (
  shareCode: string
): Promise<{ success: boolean; album: Album; message: string }> => {
  const response = await apiClient.post("/albums/clone-by-code", { shareCode });
  return response.data;
};
