import { Dispatch } from "@reduxjs/toolkit";
import logger from "../utils/logger";
import axios from "axios";
import {
  createActivityFailure,
  createActivityStart,
  createActivitySuccess,
  deleteActivityFailure,
  deleteActivityStart,
  deleteActivitySuccess,
  editActivityFailure,
  editActivityStart,
  editActivitySuccess,
  getActivityInfoFailure,
  getActivityInfoStart,
  getActivityInfoSuccess,
} from "../store/activitySlice";
import apiClient from "../api/client";

// const API_BASE_URL = "http://192.168.2.77:8082";
// const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getActivity = async (activityId: string, dispatch: Dispatch) => {
  dispatch(getActivityInfoStart());
  try {
    const response = await apiClient.get(
      `/activities/getActivity/${activityId}`
    );
    dispatch(getActivityInfoSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching activities";
    logger.error("Get Activities Error:", error);
    dispatch(getActivityInfoFailure(message));
  }
};

export const createActivity = async (
  groupActivityId: string,
  activityData: {
    activityName: string;
    activityNote: string;
    expectedBudget?: number;
    actualBudget?: number;
    payer: string;
  },
  dispatch: Dispatch
) => {
  dispatch(createActivityStart());
  try {
    const response = await apiClient.post(
      `/activities/createActivity/${groupActivityId}`,
      activityData
    );
    dispatch(createActivitySuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating activity";
    logger.error("Create Activity Error:", message);
    dispatch(createActivityFailure(message));
  }
};

export const deleteActivity = async (
  activityId: string,
  dispatch: Dispatch
) => {
  dispatch(deleteActivityStart());
  try {
    await apiClient.delete(`/activities/deleteActivity/${activityId}`);
    dispatch(deleteActivitySuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting activity";
    dispatch(deleteActivityFailure(message));
  }
};

export const editActivity = async (
  activityId: string,
  activityData: {
    activityName: string;
    activityNote: string;
    expectedBudget?: number;
    actualBudget?: number;
    payer: string;
  },
  dispatch: Dispatch
) => {
  dispatch(editActivityStart());
  try {
    await apiClient.put(
      `/activities/updateActivity/${activityId}`,
      activityData
    );
    dispatch(editActivitySuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error editing activity";
    logger.error("Edit Activity Error:", message, error.response?.data);
    dispatch(editActivityFailure(message));
    throw error; // Re-throw to allow handling in the component
  }
};
