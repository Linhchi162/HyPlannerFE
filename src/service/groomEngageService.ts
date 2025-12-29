import apiClient from "../api/client";
import { ApiResponse } from "../api/client";
import { Style } from "../store/weddingCostume";
import logger from "../utils/logger";

const BASE_PATH = "/wedding-costume";

export const getAllGroomEngageOutfits = async (): Promise<
  ApiResponse<Style[]>
> => {
  try {
    const response = await apiClient.get(`${BASE_PATH}/groom-engage/outfits`);
    return response.data;
  } catch (error) {
    logger.error("Error fetching groom engage outfits:", error);
    throw error;
  }
};

export const getAllGroomEngageAccessories = async (): Promise<
  ApiResponse<Style[]>
> => {
  try {
    const response = await apiClient.get(
      `${BASE_PATH}/groom-engage/accessories`
    );
    return response.data;
  } catch (error) {
    logger.error("Error fetching groom engage accessories:", error);
    throw error;
  }
};
