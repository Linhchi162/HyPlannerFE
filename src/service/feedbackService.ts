import { Dispatch } from "@reduxjs/toolkit";

import apiClient from "../api/client";
import {
  createFeedbackFailure,
  createFeedbackStart,
  createFeedbackSuccess,
  editFeedbackFailure,
  editFeedbackStart,
  editFeedbackSuccess,
  getFeedbackFailure,
  getFeedbackStart,
  getFeedbackSuccess,
} from "../store/feedbackSlice";
import logger from "../utils/logger";

// Lấy feedback
// Lấy feedback của user hiện tại
// GET http://localhost:8082/feedback/my-feedback/:id
export const getMyFeedback = async (userId: string, dispatch: Dispatch) => {
  dispatch(getFeedbackStart());
  try {
    const response = await apiClient.get(`/feedback/my-feedback/${userId}`);
    logger.log("Fetched My Feedback:", response.data);
    dispatch(getFeedbackSuccess(response.data as any));
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error fetching activities";
    if (error.response?.status === 404) {
      dispatch(getFeedbackSuccess(null));
    } else {
      dispatch(getFeedbackFailure(error.message));
    }
  }
};

// Tạo feedback
// POST http://localhost:8082/feedback/create/:id
export const createFeedback = async (
  userId: string,
  feedbackData: any,
  dispatch: Dispatch
) => {
  dispatch(createFeedbackStart());
  try {
    const response = await apiClient.post(
      `/feedback/create/${userId}`,
      feedbackData
    );
    dispatch(createFeedbackSuccess());
    if (response.data && response.data.feedback) {
      dispatch(getFeedbackSuccess(response.data.feedback));
    }
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error creating feedback";
    dispatch(createFeedbackFailure(message));
  }
};

// Chỉnh sửa feedback
// PUT http://localhost:8082/feedback/update/:id
export const editFeedback = async (
  userId: string,
  feedbackData: any,
  dispatch: Dispatch
) => {
  dispatch(editFeedbackStart());
  try {
    const response = await apiClient.put(
      `/feedback/update/${userId}`,
      feedbackData
    );
    dispatch(editFeedbackSuccess());
    if (response.data && response.data.feedback) {
      dispatch(getFeedbackSuccess(response.data.feedback));
    }
  } catch (error: any) {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Error updating feedback";
    dispatch(editFeedbackFailure(message));
  }
};
