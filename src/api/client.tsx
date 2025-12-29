import axios, { AxiosHeaders } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
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
    if (error.response) {
      return Promise.reject(error.response.data);
    } else if (error.request) {
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
