import { Dispatch } from "@reduxjs/toolkit";
import {
  createPhaseFailure,
  createPhaseStart,
  createPhaseSuccess,
  deletePhaseFailure,
  deletePhaseStart,
  deletePhaseSuccess,
  getPhasesFailure,
  getPhasesStart,
  getPhasesSuccess,
  Phase,
  updatePhaseFailure,
  updatePhaseStart,
  updatePhaseSuccess,
} from "../store/phaseSlice";
import axios from "axios";
import apiClient from "../api/client";
import { taskListData } from "../sampleData/SampleData";
import logger from "../utils/logger";

const API_BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
// const API_BASE_URL = "http://192.168.2.77:8082"

export const getPhases = async (eventId: string, dispatch: Dispatch) => {
  dispatch(getPhasesStart());
  try {
    const response = await apiClient.get(`/phases/getAllPhases/${eventId}`);
    dispatch(getPhasesSuccess(response.data as Phase[]));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching phases";
    dispatch(getPhasesFailure(message));
  }
};

export const createPhase = async (
  eventId: string,
  phaseData: { phaseTimeStart: string; phaseTimeEnd: string },
  dispatch: Dispatch
) => {
  dispatch(createPhaseStart());
  try {
    const response = await apiClient.post(
      `/phases/createPhase/${eventId}`,
      phaseData
    );
    dispatch(createPhaseSuccess(response.data as Phase[]));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating phase";
    dispatch(createPhaseFailure(message));
  }
};

export const updatePhase = async (
  phaseId: string,
  phaseData: { phaseTimeStart: string; phaseTimeEnd: string },
  dispatch: Dispatch
) => {
  dispatch(updatePhaseStart());
  try {
    await apiClient.put(`/phases/updatePhase/${phaseId}`, phaseData);
    dispatch(updatePhaseSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error updating phase";
    dispatch(updatePhaseFailure(message));
  }
};

export const deletePhase = async (phaseId: string, dispatch: Dispatch) => {
  dispatch(deletePhaseStart());
  try {
    await apiClient.delete(`/phases/deletePhase/${phaseId}`);
    dispatch(deletePhaseSuccess());
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error deleting phase";
    dispatch(deletePhaseFailure(message));
  }
};

export const insertSampleTasks = async (
  eventId: string,
  creatorId: string,
  eventCreatedDate: Date, // Ngày tạo event
  weddingDate?: Date, // Ngày cưới (optional)
  dispatch?: Dispatch
) => {
  try {
    // Tạo data từ sampleData với creatorId, ngày tạo event và ngày cưới
    const phasesData = taskListData(creatorId, eventCreatedDate, weddingDate);

    const response = await axios.post(
      `${API_BASE_URL}/weddingEvents/checkAndInsertTasks`,
      {
        eventId,
        phasesData,
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error("Insert Sample Tasks Error:", error);
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error inserting sample tasks";
    logger.error("Insert Sample Tasks Error:", message);
    throw new Error(message);
  }
};
