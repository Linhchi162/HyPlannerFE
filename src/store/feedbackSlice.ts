import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Feedback {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  star: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}
interface GetFeedbackState {
  feedback?: Feedback | null;
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}

interface FeedbackSliceState {
  getFeedback: GetFeedbackState;
  createFeedback: GetFeedbackState;
  deleteFeedback: GetFeedbackState;
  editFeedback: GetFeedbackState;
}
const initialState: FeedbackSliceState = {
  getFeedback: {
    feedback: undefined,
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  createFeedback: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  deleteFeedback: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  editFeedback: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
};

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    resetFeedback: (state) => {
      state.getFeedback = {
        isLoading: false,
        feedback: undefined,
        error: false,
        errorMsg: "",
      };
      state.createFeedback = {
        isLoading: false,
        error: false,
        errorMsg: "",
      };
      state.editFeedback = {
        isLoading: false,
        error: false,
        errorMsg: "",
      };
      state.deleteFeedback = {
        isLoading: false,
        error: false,
        errorMsg: "",
      };
    },
    // Get feedback
    getFeedbackStart: (state) => {
      state.getFeedback.isLoading = true;
    },
    getFeedbackSuccess: (state, action: PayloadAction<Feedback | null>) => {
      state.getFeedback.isLoading = false;
      state.getFeedback.feedback = action.payload;
      state.getFeedback.error = false;
    },
    getFeedbackFailure: (state, action: PayloadAction<string>) => {
      state.getFeedback.isLoading = false;
      state.getFeedback.error = true;
      state.getFeedback.errorMsg = action.payload;
    },
    // Create feedback
    createFeedbackStart: (state) => {
      state.createFeedback.isLoading = true;
    },
    createFeedbackSuccess: (state) => {
      state.createFeedback.isLoading = false;
      state.createFeedback.error = false;
    },
    createFeedbackFailure: (state, action: PayloadAction<string>) => {
      state.createFeedback.isLoading = false;
      state.createFeedback.error = true;
      state.createFeedback.errorMsg = action.payload;
    },
    // Edit feedback
    editFeedbackStart: (state) => {
      state.editFeedback.isLoading = true;
    },
    editFeedbackSuccess: (state) => {
      state.editFeedback.isLoading = false;
      state.editFeedback.error = false;
    },
    editFeedbackFailure: (state, action: PayloadAction<string>) => {
      state.editFeedback.isLoading = false;
      state.editFeedback.error = true;
      state.editFeedback.errorMsg = action.payload;
    },
    // Delete feedback
    deleteFeedbackStart: (state) => {
      state.deleteFeedback.isLoading = true;
    },
    deleteFeedbackSuccess: (state) => {
      state.deleteFeedback.isLoading = false;
      state.deleteFeedback.error = false;
    },
    deleteFeedbackFailure: (state, action: PayloadAction<string>) => {
      state.deleteFeedback.isLoading = false;
      state.deleteFeedback.error = true;
      state.deleteFeedback.errorMsg = action.payload;
    },
  },
});
export const {
  getFeedbackStart,
  getFeedbackSuccess,
  getFeedbackFailure,
  createFeedbackStart,
  createFeedbackSuccess,
  createFeedbackFailure,
  editFeedbackStart,
  editFeedbackSuccess,
  editFeedbackFailure,
  deleteFeedbackStart,
  deleteFeedbackSuccess,
  deleteFeedbackFailure,
  resetFeedback,
} = feedbackSlice.actions;
export default feedbackSlice.reducer;
