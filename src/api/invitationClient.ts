import axios, { AxiosHeaders } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const invitationBaseUrl =
  process.env.EXPO_PUBLIC_INVITATION_BASE_URL ||
  process.env.EXPO_PUBLIC_BASE_URL;

const invitationClient = axios.create({
  baseURL: invitationBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

invitationClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("appToken");
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

invitationClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    if (error.request) {
      return Promise.reject({
        success: false,
        message: "Network error - No response from server",
      });
    }
    return Promise.reject({
      success: false,
      message: "Request configuration error",
    });
  }
);

export default invitationClient;

