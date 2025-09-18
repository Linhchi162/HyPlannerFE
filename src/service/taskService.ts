import { Dispatch } from "@reduxjs/toolkit";
import axios from "axios";
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

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;

export const getTasks = async (taskId: string, dispatch: Dispatch) => {
  dispatch(getTaskInfoStart());
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks/getTask/${taskId}`);
    dispatch(getTaskInfoSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching tasks";
    console.error("Get Tasks Error:", message);
    dispatch(getTaskInfoFailure(message));
  }
};

export const createTask = async (
  phaseId: string,
  taskData: { taskName: string; taskNote: string; member?: string[]; expectedBudget: number; actualBudget?: number },
  dispatch: Dispatch
) => {
  dispatch(createTaskStart());
  try {
    const response = await axios.post(
      `${API_BASE_URL}/tasks/createTask/${phaseId}`,
      taskData
    );
    dispatch(createTaskSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating task";
    console.error("Create Task Error:", message);
    dispatch(createTaskFailure(message));
  }
};

export const deleteTask = async (taskId: string, dispatch: Dispatch) => {
  dispatch(deleteTaskStart());
  try {
    await axios.delete(`${API_BASE_URL}/tasks/deleteTask/${taskId}`);
    dispatch(deleteTaskSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting task";
    console.error("Delete Task Error:", message);
    dispatch(deleteTaskFailure(message));
  }
};

export const editTask = async (
  taskId: string,
  taskData: { taskName: string; taskNote: string; member?: string[]; expectedBudget: number; actualBudget?: number },
  dispatch: Dispatch
) => {
  dispatch(editTaskStart());
  try {
    await axios.put(`${API_BASE_URL}/tasks/updateTask/${taskId}`, taskData);
    dispatch(editTaskSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error editing task";
    console.error("Edit Task Error:", message);
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
    await axios.put(`${API_BASE_URL}/tasks/markCompleted/${taskId}`, {
      completed,
    });
    dispatch(editTaskSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error marking task";
    console.error("Mark Task Error:", message);
    dispatch(editTaskFailure(message));
  }
};