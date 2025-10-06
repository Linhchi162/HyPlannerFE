import apiClient from '../api/client';

export interface ToneColorItem {
  _id: string;
  name: string;
  image: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Correct base path per BE routes (singular)
const BASE_PATH = '/wedding-costume';

export const getWeddingToneColors = async () => {
  const url = `${BASE_PATH}/wedding-tone-colors`;
  const res = await apiClient.get<ApiResponse<ToneColorItem[]>>(url);
  return res.data;
};

export const getEngageToneColors = async () => {
  const url = `${BASE_PATH}/engage-tone-colors`;
  const res = await apiClient.get<ApiResponse<ToneColorItem[]>>(url);
  return res.data;
};


