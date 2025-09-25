import { Dispatch } from "@reduxjs/toolkit";
import axios from "axios";
import {
  createGroupActivityFailure,
  createGroupActivityStart,
  createGroupActivitySuccess,
  getGroupActivitiesFailure,
  getGroupActivitiesStart,
  getGroupActivitiesSuccess,
  GroupActivity,
} from "../store/groupActivitySlice";

// const API_BASE_URL = "http://192.168.2.77:8082";
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getGroupActivities = async (
  eventId: string,
  dispatch: Dispatch
) => {
  dispatch(getGroupActivitiesStart());
  try {
    const response = await axios.get(
      `${API_BASE_URL}/groupActivities/getAllActivities/${eventId}`
    );
    dispatch(getGroupActivitiesSuccess(response.data as GroupActivity[]));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching group activities";
    dispatch(getGroupActivitiesFailure(message));
  }
};

export const createGroupActivity = async (
  eventId: string,
  groupName: string,
  dispatch: Dispatch
) => {
  dispatch(createGroupActivityStart());
  try {
    const response = await axios.post(
      `${API_BASE_URL}/groupActivities/createGroupActivity/${eventId}`,
      { groupName }
    );
    dispatch(createGroupActivitySuccess(response.data as GroupActivity));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating group activity";
    dispatch(createGroupActivityFailure(message));
  }
};
