import { Dispatch } from "@reduxjs/toolkit";
import axios from "axios";
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

export const getWeddingEvent = async (
  userId: string,
  dispatch: Dispatch
) => {
  dispatch(getWeddingEventStart());
  try {
    const response = await apiClient.get(`/weddingEvents/getUserWeddingEvents/${userId}`);
    dispatch(getWeddingEventSuccess(response.data as any));
  } catch (error: any) {
    console.log("Error object:", error);
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching wedding event";
    console.error("Get Wedding Event Error:", message);
    dispatch(getWeddingEventFailure(message));
  }
};

export const createWeddingEvent = async (
  weddingData: { creatorId: string; brideName: string; groomName: string; budget: number; timeToMarried: string },
  dispatch: Dispatch
) => {
  dispatch(createWeddingEventStart());
  try {
    await apiClient.post(`/weddingEvents/createWeddingEvent`, weddingData);
    dispatch(createWeddingEventSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching tasks";
    console.error("Get Tasks Error:", message);
    dispatch(createWeddingEventFailure(message));
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
    await apiClient.post(`/weddingEvents/leaveWeddingEvent`, { eventId, userId });
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
