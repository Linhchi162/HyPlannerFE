import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// Định nghĩa enum cho payer
export enum PayerType {
  BRIDE = "bride",
  GROOM = "groom",
  BOTH = "both",
}
export interface Activity {
  _id: string;
  activityName: string;
  activityNote: string;
  expectedBudget?: number;
  actualBudget?: number;
  payer: PayerType;
}
interface GetActivitiesState {
  activities?: Activity[];
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface GetActivityInfoState {
  activity?: Activity;
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface ActivitySliceState {
  getActivities: GetActivitiesState;
  createActivity: GetActivitiesState;
  deleteActivity: GetActivitiesState;
  editActivity: GetActivitiesState;
  getActivityInfo: GetActivityInfoState;
};
const initialState: ActivitySliceState = {
  getActivities: {
    activities: [],
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  createActivity: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  deleteActivity: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  editActivity: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  getActivityInfo: {
    activity: undefined,
    isLoading: false,
    error: false,
    errorMsg: "",
  },
};

const activitySlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    getActivitiesStart: (state) => {
      state.getActivities.isLoading = true;
    },
    getActivitiesSuccess: (state, action: PayloadAction<Activity[]>) => {
      state.getActivities.isLoading = false;
      state.getActivities.activities = action.payload;
      state.getActivities.error = false;
    },
    getActivitiesFailure: (state, action: PayloadAction<string>) => {
      state.getActivities.isLoading = false;
      state.getActivities.error = true;
      state.getActivities.errorMsg = action.payload;
    },
    // Create activity
    createActivityStart: (state) => {
      state.createActivity.isLoading = true;
    },
    createActivitySuccess: (state) => {
      state.createActivity.isLoading = false;
      state.createActivity.error = false;
    },
    createActivityFailure: (state, action: PayloadAction<string>) => {
      state.createActivity.isLoading = false;
      state.createActivity.error = true;
      state.createActivity.errorMsg = action.payload;
    },
    // Delete activity
    deleteActivityStart: (state) => {
      state.deleteActivity.isLoading = true;
    },
    deleteActivitySuccess: (state) => {
      state.deleteActivity.isLoading = false;
      state.deleteActivity.error = false;
    },
    deleteActivityFailure: (state, action: PayloadAction<string>) => {
      state.deleteActivity.isLoading = false;
      state.deleteActivity.error = true;
      state.deleteActivity.errorMsg = action.payload;
    },
    // Edit activity
    editActivityStart: (state) => {
      state.editActivity.isLoading = true;
    },
    editActivitySuccess: (state) => {
      state.editActivity.isLoading = false;
      state.editActivity.error = false;
    },
    editActivityFailure: (state, action: PayloadAction<string>) => {
      state.editActivity.isLoading = false;
      state.editActivity.error = true;
      state.editActivity.errorMsg = action.payload;
    },
    // Get activity info
    getActivityInfoStart: (state) => {
      state.getActivityInfo.isLoading = true;
    },
    getActivityInfoSuccess: (state, action: PayloadAction<Activity>) => {
      state.getActivityInfo.isLoading = false;
      state.getActivityInfo.activity = action.payload;
      state.getActivityInfo.error = false;
    },
    getActivityInfoFailure: (state, action: PayloadAction<string>) => {
      state.getActivityInfo.isLoading = false;
      state.getActivityInfo.error = true;
      state.getActivityInfo.errorMsg = action.payload;
    },
  },
});
export const {
  getActivitiesStart,
  getActivitiesSuccess,
  getActivitiesFailure,
  createActivityStart,
  createActivitySuccess,
  createActivityFailure,
  deleteActivityStart,
  deleteActivitySuccess,
  deleteActivityFailure,
  editActivityStart,
  editActivitySuccess,
  editActivityFailure,
  getActivityInfoStart,
  getActivityInfoSuccess,
  getActivityInfoFailure,
} = activitySlice.actions;
export default activitySlice.reducer;
