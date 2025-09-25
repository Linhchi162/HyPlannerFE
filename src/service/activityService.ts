import { Dispatch } from "@reduxjs/toolkit";
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

// const API_BASE_URL = "http://192.168.2.77:8082";
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getActivity = async (activityId: string, dispatch: Dispatch) => {
  dispatch(getActivityInfoStart());
  try {
    const response = await axios.get(
      `${API_BASE_URL}/activities/getActivity/${activityId}`
    );
    dispatch(getActivityInfoSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching activities";
    console.error("Get Activities Error:", error);
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
    const response = await axios.post(
      `${API_BASE_URL}/activities/createActivity/${groupActivityId}`,
      activityData
    );
    dispatch(createActivitySuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating activity";
    console.error("Create Activity Error:", message);
    dispatch(createActivityFailure(message));
  }
};

export const deleteActivity = async (
  activityId: string,
  dispatch: Dispatch
) => {
  dispatch(deleteActivityStart());
  try {
    await axios.delete(
      `${API_BASE_URL}/activities/deleteActivity/${activityId}`
    );
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
    await axios.put(
      `${API_BASE_URL}/activities/updateActivity/${activityId}`,
      activityData
    );
    dispatch(editActivitySuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error editing activity";
    console.error("Edit Activity Error:", message);
    dispatch(editActivityFailure(message));
  }
};
