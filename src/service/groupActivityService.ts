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
import apiClient from "../api/client";
import { budgetListData } from "../sampleData/SampleData";

// const API_BASE_URL = "http://192.168.2.77:8082";
const API_BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const getGroupActivities = async (
  eventId: string,
  dispatch: Dispatch
) => {
  dispatch(getGroupActivitiesStart());
  try {
    const response = await apiClient.get(
      `/groupActivities/getAllActivities/${eventId}`
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
    await apiClient.post(`/groupActivities/createGroupActivity/${eventId}`, {
      groupName,
    });
    dispatch(createGroupActivitySuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating group activity";
    dispatch(createGroupActivityFailure(message));
  }
};

export const insertSampleGroupActivity = async (eventId: string) => {
  try {
    // Tạo data từ sampleData với creatorId
    const budgetData = budgetListData();

    const response = await axios.post(
      `${API_BASE_URL}/weddingEvents/checkAndInsertActivities`,
      {
        eventId,
        groupActivitiesData: budgetData,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Insert Sample Group Activities Error:", error);
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error inserting sample group activities";
    console.error("Insert Sample Group Activities Error:", message);
    throw new Error(message);
  }
};

export const updateGroupActivity = async (
  groupId: string,
  groupName: string,
  dispatch: Dispatch
) => {
  try {
    await apiClient.put(`/groupActivities/updateGroupActivity/${groupId}`, {
      groupName,
    });
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error updating group activity";
    throw new Error(message);
  }
};

export const deleteGroupActivity = async (
  groupId: string,
  dispatch: Dispatch
) => {
  try {
    await apiClient.delete(`/groupActivities/deleteGroupActivity/${groupId}`);
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting group activity";
    throw new Error(message);
  }
};
