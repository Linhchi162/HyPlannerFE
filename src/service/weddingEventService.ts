import { Dispatch } from "@reduxjs/toolkit";
import axios from "axios";
import logger from "../utils/logger";
import {
  createWeddingEventFailure,
  createWeddingEventStart,
  createWeddingEventSuccess,
  getWeddingEventFailure,
  getWeddingEventStart,
  getWeddingEventSuccess,
  joinWeddingEventFailure,
  joinWeddingEventStart,
  joinWeddingEventSuccess,
  leaveWeddingEventFailure,
  leaveWeddingEventStart,
  leaveWeddingEventSuccess,
} from "../store/weddingEventSlice";
import apiClient from "../api/client";

// const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;
// const API_BASE_URL = "http://192.168.2.77:8082"

export const getWeddingEvent = async (userId: string, dispatch: Dispatch) => {
  dispatch(getWeddingEventStart());
  try {
    const response = await apiClient.get(
      `/weddingEvents/getUserWeddingEvents/${userId}`
    );
    dispatch(getWeddingEventSuccess(response.data as any));
  } catch (error: any) {
    logger.log("Error object:", error);
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching wedding event";
    logger.error("Get Wedding Event Error:", message);
    dispatch(getWeddingEventFailure(message));
  }
};

export const createWeddingEvent = async (
  weddingData: {
    creatorId: string;
    brideName: string;
    groomName: string;
    budget: number;
    timeToMarried: string;
  },
  dispatch: Dispatch
) => {
  dispatch(createWeddingEventStart());
  try {
    await apiClient.post(`/weddingEvents/createWeddingEvent`, weddingData);
    dispatch(createWeddingEventSuccess());

    // Sau khi tạo thành công, fetch lại wedding event để lưu vào Redux
    await getWeddingEvent(weddingData.creatorId, dispatch);
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating wedding event";
    logger.error("Create Wedding Event Error:", message);
    dispatch(createWeddingEventFailure(message));
    throw error;
  }
};

export const joinWeddingEvent = async (
  code: string,
  userId: string,
  dispatch: Dispatch
) => {
  dispatch(joinWeddingEventStart());
  try {
    await apiClient.post(`/weddingEvents/addMember`, { code, userId });
    dispatch(joinWeddingEventSuccess());

    // Sau khi join thành công, fetch lại wedding event để lưu vào Redux
    await getWeddingEvent(userId, dispatch);
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error joining wedding event";
    dispatch(joinWeddingEventFailure(message));
    throw message;
  }
};

export const leaveWeddingEvent = async (
  eventId: string,
  userId: string,
  dispatch: Dispatch
) => {
  dispatch(leaveWeddingEventStart());
  try {
    await apiClient.post(`/weddingEvents/leaveWeddingEvent`, {
      eventId,
      userId,
    });
    dispatch(leaveWeddingEventSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error leaving wedding event";
    dispatch(leaveWeddingEventFailure(message));
    throw message;
  }
};

export const deleteWeddingEvent = async (
  eventId: string,
  dispatch: Dispatch
) => {
  try {
    await apiClient.delete(`/weddingEvents/deleteWeddingEvent/${eventId}`);
    logger.log("Wedding event deleted successfully");
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting wedding event";
    logger.error("Delete Wedding Event Error:", message);
    throw message;
  }
};

export const updateWeddingEvent = async (
  eventId: string,
  updateData: {
    brideName?: string;
    groomName?: string;
    brideFather?: string;
    brideMother?: string;
    groomFather?: string;
    groomMother?: string;
    timeToMarried?: string;
  },
  dispatch: Dispatch
) => {
  try {
    const response = await apiClient.put(
      `/weddingEvents/updateWeddingEvent/${eventId}`,
      updateData
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error updating wedding event";
    logger.error("Update Wedding Event Error:", message);
    throw message;
  }
};
