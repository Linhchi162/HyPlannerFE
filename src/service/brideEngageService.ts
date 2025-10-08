import apiClient from '../api/client';
import { Style, Material, ApiResponse } from '../store/weddingCostume';

const BASE_PATH = '/wedding-costume';

// Bride Ao Dai Styles
export async function getAllBrideEngageStyles(): Promise<ApiResponse<Style[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Style[]>>(`${BASE_PATH}/bride-engage/styles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bride engage styles:', error);
    throw error;
  }
}

// Bride Ao Dai Materials
export async function getAllBrideEngageMaterials(): Promise<ApiResponse<Material[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Material[]>>(`${BASE_PATH}/bride-engage/materials`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bride engage materials:', error);
    throw error;
  }
}

// Bride Ao Dai Patterns
export async function getAllBrideEngagePatterns(): Promise<ApiResponse<Style[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Style[]>>(`${BASE_PATH}/bride-engage/patterns`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bride engage patterns:', error);
    throw error;
  }
}

// Bride Headwears
export async function getAllBrideEngageHeadwears(): Promise<ApiResponse<Style[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Style[]>>(`${BASE_PATH}/bride-engage/headwears`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bride engage headwears:', error);
    throw error;
  }
}
