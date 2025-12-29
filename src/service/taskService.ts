import { Dispatch } from "@reduxjs/toolkit";
import axios from "axios";
import logger from "../utils/logger";
import {
  createTaskFailure,
  createTaskStart,
  createTaskSuccess,
  deleteTaskFailure,
  deleteTaskStart,
  deleteTaskSuccess,
  editTaskFailure,
  editTaskStart,
  editTaskSuccess,
  getTaskInfoFailure,
  getTaskInfoStart,
  getTaskInfoSuccess,
} from "../store/taskSlice";
import apiClient from "../api/client";

// const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getTasks = async (taskId: string, dispatch: Dispatch) => {
  dispatch(getTaskInfoStart());
  try {
    const response = await apiClient.get(`/tasks/getTask/${taskId}`);
    dispatch(getTaskInfoSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching tasks";
    logger.error("Get Tasks Error:", message);
    dispatch(getTaskInfoFailure(message));
  }
};

export const createTask = async (
  phaseId: string,
  taskData: { taskName: string; taskNote: string; member?: string[] },
  dispatch: Dispatch
) => {
  dispatch(createTaskStart());
  try {
    const response = await apiClient.post(
      `/tasks/createTask/${phaseId}`,
      taskData
    );
    dispatch(createTaskSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating task";
    logger.error("Create Task Error:", message);
    dispatch(createTaskFailure(message));
  }
};

export const deleteTask = async (taskId: string, dispatch: Dispatch) => {
  dispatch(deleteTaskStart());
  try {
    await apiClient.delete(`/tasks/deleteTask/${taskId}`);
    dispatch(deleteTaskSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting task";
    logger.error("Delete Task Error:", message);
    dispatch(deleteTaskFailure(message));
  }
};

export const editTask = async (
  taskId: string,
  taskData: { taskName: string; taskNote: string; member?: string[] },
  dispatch: Dispatch
) => {
  dispatch(editTaskStart());
  try {
    await apiClient.put(`/tasks/updateTask/${taskId}`, taskData);
    dispatch(editTaskSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error editing task";
    logger.error("Edit Task Error:", message);
    dispatch(editTaskFailure(message));
  }
};

export const markTaskCompleted = async (
  taskId: string,
  completed: boolean,
  dispatch: Dispatch
) => {
  dispatch(editTaskStart());
  try {
    await apiClient.put(`/tasks/markCompleted/${taskId}`, {
      completed,
    });
    dispatch(editTaskSuccess());
  } catch (error: any) {
    let message = "Error marking task";
    let errorDetails: any = {
      taskId,
      completed,
    };

    // Check if error has response data (from interceptor)
    if (
      error.message &&
      typeof error === "object" &&
      !error.response &&
      !error.request
    ) {
      // This is transformed error from apiClient interceptor
      message = error.message || message;
      errorDetails = {
        ...errorDetails,
        type: "API Error (from interceptor)",
        errorData: error,
      };
    } else if (error.response) {
      // Server responded with error status (shouldn't happen due to interceptor)
      message = error.response.data?.message || message;
      errorDetails = {
        ...errorDetails,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response (network error)
      message = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      errorDetails = {
        ...errorDetails,
        type: "Network Error",
        request: error.request?._url || "Unknown URL",
      };
    } else {
      // Something else happened
      message = error.message || message;
      errorDetails = {
        ...errorDetails,
        type: "Unknown Error",
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      };
    }

    logger.error("Mark Task Error:", errorDetails);

    dispatch(editTaskFailure(message));
    throw new Error(message);
  }
};
