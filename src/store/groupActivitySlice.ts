import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Activity } from "./activitySlice";
// import { Task } from "./taskSlice";

export interface GroupActivity {
  _id: string;
  groupName: string;
  activities: Activity[];
}
interface GetGroupActivitiesState {
  groupActivities: GroupActivity[];
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface CreateGroupActivityState {
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface GroupActivitySliceState {
  getGroupActivities: GetGroupActivitiesState;
  createGroupActivity: CreateGroupActivityState;
}
const initialState: GroupActivitySliceState = {
  getGroupActivities: {
    groupActivities: [],
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  createGroupActivity: {
    // groupActivities: [],
    isLoading: false,
    error: false,
    errorMsg: "",
  },
};

const groupActivitySlice = createSlice({
  name: "groupActivities",
  initialState,
  reducers: {
    getGroupActivitiesStart: (state) => {
      state.getGroupActivities.isLoading = true;
    },
    getGroupActivitiesSuccess: (state, action: PayloadAction<GroupActivity[]>) => {
      state.getGroupActivities.isLoading = false;
      state.getGroupActivities.groupActivities = action.payload;
      state.getGroupActivities.error = false;
    },
    getGroupActivitiesFailure: (state, action: PayloadAction<string>) => {
      state.getGroupActivities.isLoading = false;
      state.getGroupActivities.error = true;
      state.getGroupActivities.errorMsg = action.payload;
    },
    // Create group activity
    createGroupActivityStart: (state) => {
      state.createGroupActivity.isLoading = true;
    },
    createGroupActivitySuccess: (state) => {
      state.createGroupActivity.isLoading = false;
      // state.createGroupActivity.groupActivities.push(action.payload);
      state.createGroupActivity.error = false;
    },
    createGroupActivityFailure: (state, action: PayloadAction<string>) => {
      state.createGroupActivity.isLoading = false;
      state.createGroupActivity.error = true;
      state.createGroupActivity.errorMsg = action.payload;
    },
  },
});
export const { getGroupActivitiesStart, getGroupActivitiesSuccess, getGroupActivitiesFailure, createGroupActivityStart, createGroupActivitySuccess, createGroupActivityFailure } =
  groupActivitySlice.actions;
export default groupActivitySlice.reducer;
