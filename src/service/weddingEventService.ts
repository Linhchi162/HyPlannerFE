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

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getWeddingEvent = async (
  creatorId: string,
  dispatch: Dispatch
) => {
  dispatch(getWeddingEventStart());
  try {
    const response = await axios.get(`${API_BASE_URL}/weddingEvents/getUserWeddingEvents/${creatorId}`);
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
    await axios.post(`${API_BASE_URL}/weddingEvents/createWeddingEvent`, weddingData);
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
    await axios.post(`${API_BASE_URL}/weddingEvents/addMember`, { code, userId });
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
    await axios.post(`${API_BASE_URL}/weddingEvents/leaveWeddingEvent`, { eventId, userId });
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
