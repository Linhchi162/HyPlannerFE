import axios, { AxiosHeaders } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BASE_URL = "https://hy-planner-be.vercel.app";
const ALT_BASE_URL = "https://hyplanner-be.vercel.app";

const normalizeBase = (raw?: string) => (raw || "").replace(/\/+$/, "");

const getAlternateBaseUrl = (current?: string) => {
  const normalized = normalizeBase(current);
  if (!normalized) return ALT_BASE_URL;
  if (normalized === normalizeBase(DEFAULT_BASE_URL)) return ALT_BASE_URL;
  if (normalized === normalizeBase(ALT_BASE_URL)) return DEFAULT_BASE_URL;
  return DEFAULT_BASE_URL;
};

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL || DEFAULT_BASE_URL,
  timeout: 30000, // 30 seconds - increased for slow backend responses
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("appToken");
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // FormData: không set Content-Type (kể cả multipart thủ công) — thiếu boundary
      // khiến multer báo "Unexpected field". Để adapter tự gắn multipart + boundary.
      if (
        typeof FormData !== "undefined" &&
        config.data instanceof FormData
      ) {
        if (config.headers instanceof AxiosHeaders) {
          config.headers.delete("Content-Type");
        } else {
          delete (config.headers as Record<string, unknown>)["Content-Type"];
        }
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config as any;
    if (error.response) {
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Retry one time with alternate base URL when no response received.
      if (originalConfig && !originalConfig.__retryWithAltBaseUrl) {
        originalConfig.__retryWithAltBaseUrl = true;
        originalConfig.baseURL = getAlternateBaseUrl(
          originalConfig.baseURL || apiClient.defaults.baseURL
        );
        return apiClient.request(originalConfig);
      }
      return Promise.reject({
        success: false,
        message: "Network error - No response from server",
      });
    } else {
      return Promise.reject({
        success: false,
        message: "Request configuration error",
      });
    }
  }
);

export default apiClient;
