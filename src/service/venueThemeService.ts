import apiClient from "../api/client";

export interface SimpleItem {
  _id: string;
  name: string;
  image: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// GET venues (plural path per spec)
export const getWeddingVenues = async () => {
  const res = await apiClient.get<ApiResponse<SimpleItem[]>>(
    "/wedding-costume/wedding-venues"
  );
  return res.data;
};

// GET themes (singular base path per spec)
export const getWeddingThemes = async () => {
  const res = await apiClient.get<ApiResponse<SimpleItem[]>>(
    "/wedding-costume/wedding-themes"
  );
  return res.data;
};
