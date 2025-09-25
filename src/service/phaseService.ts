import { Dispatch } from "@reduxjs/toolkit";
import { createPhaseFailure, createPhaseStart, createPhaseSuccess, getPhasesFailure, getPhasesStart, getPhasesSuccess, Phase } from "../store/phaseSlice";
import axios from "axios";
import apiClient from "../api/client";

// const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SCHEME;
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

export const createPhase = async (eventId: string, phaseData: { phaseTimeStart: string; phaseTimeEnd: string }, dispatch: Dispatch) => {
  dispatch(createPhaseStart());
    try {
        const response = await apiClient.post(`/phases/createPhase/${eventId}`, phaseData);
        dispatch(createPhaseSuccess(response.data as Phase[]));
    } catch (error: any) {
        const message =
            error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : "Error creating phase";
        dispatch(createPhaseFailure(message));
    }
};