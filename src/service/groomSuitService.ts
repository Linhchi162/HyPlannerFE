import apiClient from "../api/client";
import { Style, ApiResponse } from "../store/weddingCostume";

const BASE_PATH = "/wedding-costume";

// Real endpoints for Groom Vest Styles
export const getVestStyles = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/styles`);
  const payload = response.data as unknown;
  // Normalize: support both ApiResponse { success, data } and raw array
  const data: Style[] = Array.isArray(payload)
    ? (payload as Style[])
    : (payload as any)?.data ?? [];
  return { success: true, data };
};

// Note: POST endpoints are intentionally not implemented per request

export const getVestMaterials = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/materials`);
  const payload = response.data as unknown;
  const data: Style[] = Array.isArray(payload) ? (payload as Style[]) : (payload as any)?.data ?? [];
  return { success: true, data };
};

export const getVestColors = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/colors`);
  const payload = response.data as unknown;
  const data: Style[] = Array.isArray(payload) ? (payload as Style[]) : (payload as any)?.data ?? [];
  return { success: true, data };
};

export const getVestLapels = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/lapels`);
  const payload = response.data as unknown;
  const data: Style[] = Array.isArray(payload) ? (payload as Style[]) : (payload as any)?.data ?? [];
  return { success: true, data };
};

export const getVestPockets = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/pockets`);
  const payload = response.data as unknown;
  const data: Style[] = Array.isArray(payload) ? (payload as Style[]) : (payload as any)?.data ?? [];
  return { success: true, data };
};

export const getVestDecorations = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get(`${BASE_PATH}/vest/decorations`);
  const payload = response.data as unknown;
  const data: Style[] = Array.isArray(payload) ? (payload as Style[]) : (payload as any)?.data ?? [];
  return { success: true, data };
};



