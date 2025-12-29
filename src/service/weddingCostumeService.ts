import apiClient from "../api/client";
import {
  Style,
  Material,
  Neckline,
  Detail,
  ApiResponse,
} from "../store/weddingCostume";

const BASE_PATH = "/wedding-costume";

// Style Services
export const getAllStyles = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/styles`
  );
  return response.data;
};

export const createStyle = async (
  styleData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/styles`,
    styleData
  );
  return response.data;
};

// Material Services
export const getAllMaterials = async (): Promise<ApiResponse<Material[]>> => {
  const response = await apiClient.get<ApiResponse<Material[]>>(
    `${BASE_PATH}/materials`
  );
  return response.data;
};

export const createMaterial = async (
  materialData: Omit<Material, "_id">
): Promise<ApiResponse<Material>> => {
  const response = await apiClient.post<ApiResponse<Material>>(
    `${BASE_PATH}/materials`,
    materialData
  );
  return response.data;
};

// Neckline Services
export const getAllNecklines = async (): Promise<ApiResponse<Neckline[]>> => {
  const response = await apiClient.get<ApiResponse<Neckline[]>>(
    `${BASE_PATH}/necklines`
  );
  return response.data;
};

export const createNeckline = async (
  necklineData: Omit<Neckline, "_id">
): Promise<ApiResponse<Neckline>> => {
  const response = await apiClient.post<ApiResponse<Neckline>>(
    `${BASE_PATH}/necklines`,
    necklineData
  );
  return response.data;
};

// Detail Services
export const getAllDetails = async (): Promise<ApiResponse<Detail[]>> => {
  const response = await apiClient.get<ApiResponse<Detail[]>>(
    `${BASE_PATH}/details`
  );
  return response.data;
};

export const createDetail = async (
  detailData: Omit<Detail, "_id">
): Promise<ApiResponse<Detail>> => {
  const response = await apiClient.post<ApiResponse<Detail>>(
    `${BASE_PATH}/details`,
    detailData
  );
  return response.data;
};

// Veil Services
export const getAllVeils = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/accessories/veils`
  );
  return response.data;
};

export const createVeil = async (
  veilData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/accessories/veils`,
    veilData
  );
  return response.data;
};

// Jewelry Services
export const getAllJewelry = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/accessories/jewelry`
  );
  return response.data;
};

export const createJewelry = async (
  jewelryData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/accessories/jewelry`,
    jewelryData
  );
  return response.data;
};

// Hairpin Services
export const getAllHairpins = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/accessories/hairpins`
  );
  return response.data;
};

export const createHairpin = async (
  hairpinData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/accessories/hairpins`,
    hairpinData
  );
  return response.data;
};

// Crown Services
export const getAllCrowns = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/accessories/crowns`
  );
  return response.data;
};

export const createCrown = async (
  crownData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/accessories/crowns`,
    crownData
  );
  return response.data;
};

// Wedding Flower Services
export const getAllFlowers = async (): Promise<ApiResponse<Style[]>> => {
  const response = await apiClient.get<ApiResponse<Style[]>>(
    `${BASE_PATH}/flowers`
  );
  return response.data;
};

export const createFlower = async (
  flowerData: Omit<Style, "_id">
): Promise<ApiResponse<Style>> => {
  const response = await apiClient.post<ApiResponse<Style>>(
    `${BASE_PATH}/flowers`,
    flowerData
  );
  return response.data;
};
