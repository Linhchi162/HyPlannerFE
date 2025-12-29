import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Activity } from "./activitySlice";

export interface Member {
  _id: string;
  fullName: string;
  email: string;
  picture?: string;
}
export interface WeddingEvent {
  _id: string;
  brideName: string;
  budget: number;
  groomName: string;
  groupActivities?: string[]; // Thêm trường groupActivities nếu cần thiết
  member: Member[];
  creatorId: string;
  phases?: string[];
  timeToMarried: string; // ISO string format
  createdAt?: string;
}
interface GetWeddingEventState {
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
  weddingEvent: WeddingEvent;
}
interface CreateWeddingEventState {
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface JoinWeddingEventState {
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface LeaveWeddingEventState {
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface WeddingEventState {
  getWeddingEvent: GetWeddingEventState;
  createWeddingEvent: CreateWeddingEventState;
  joinWeddingEvent: JoinWeddingEventState;
  leaveWeddingEvent: LeaveWeddingEventState;
}
const initialState: WeddingEventState = {
  getWeddingEvent: {
    isLoading: false,
    error: false,
    errorMsg: "",
    weddingEvent: {
      _id: "",
      brideName: "",
      budget: 0,
      groomName: "",
      groupActivities: [],
      member: [],
      creatorId: "",
      phases: [],
      timeToMarried: "",
    },
  },
  createWeddingEvent: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  joinWeddingEvent: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  leaveWeddingEvent: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
};

const weddingEventSlice = createSlice({
  name: "weddingEvent",
  initialState,
  reducers: {
    // Get wedding event
    getWeddingEventStart: (state) => {
      state.getWeddingEvent.isLoading = true;
    },
    getWeddingEventSuccess: (state, action: PayloadAction<WeddingEvent>) => {
      state.getWeddingEvent.isLoading = false;
      state.getWeddingEvent.weddingEvent = action.payload;
      state.getWeddingEvent.error = false;
    },
    getWeddingEventFailure: (state, action: PayloadAction<string>) => {
      state.getWeddingEvent.isLoading = false;
      state.getWeddingEvent.error = true;
      state.getWeddingEvent.errorMsg = action.payload;
    },
    // Create wedding event
    createWeddingEventStart: (state) => {
      state.createWeddingEvent.isLoading = true;
    },
    createWeddingEventSuccess: (state) => {
      state.createWeddingEvent.isLoading = false;
      state.createWeddingEvent.error = false;
    },
    createWeddingEventFailure: (state, action: PayloadAction<string>) => {
      state.createWeddingEvent.isLoading = false;
      state.createWeddingEvent.error = true;
      state.createWeddingEvent.errorMsg = action.payload;
    },
    // Join wedding event
    joinWeddingEventStart: (state) => {
      state.joinWeddingEvent.isLoading = true;
    },
    joinWeddingEventSuccess: (state) => {
      state.joinWeddingEvent.isLoading = false;
      state.joinWeddingEvent.error = false;
    },
    joinWeddingEventFailure: (state, action: PayloadAction<string>) => {
      state.joinWeddingEvent.isLoading = false;
      state.joinWeddingEvent.error = true;
      state.joinWeddingEvent.errorMsg = action.payload;
    },
    // Leave wedding event
    leaveWeddingEventStart: (state) => {
      state.leaveWeddingEvent.isLoading = true;
    },
    leaveWeddingEventSuccess: (state) => {
      state.leaveWeddingEvent.isLoading = false;
      state.leaveWeddingEvent.error = false;
    },
    leaveWeddingEventFailure: (state, action: PayloadAction<string>) => {
      state.leaveWeddingEvent.isLoading = false;
      state.leaveWeddingEvent.error = true;
      state.leaveWeddingEvent.errorMsg = action.payload;
    },
    setWeddingEventFromCheck: (state, action: PayloadAction<WeddingEvent>) => {
      // Nó ghi dữ liệu vào đúng vị trí của state 'getWeddingEvent'
      state.getWeddingEvent.weddingEvent = action.payload;
      // Đồng thời reset lại trạng thái loading/error của 'get' để đảm bảo nhất quán
      state.getWeddingEvent.isLoading = false;
      state.getWeddingEvent.error = false;
      state.getWeddingEvent.errorMsg = "";
    },
    // Clear wedding event - reset về initialState
    clearWeddingEvent: (state) => {
      state.getWeddingEvent = initialState.getWeddingEvent;
      state.createWeddingEvent = initialState.createWeddingEvent;
      state.joinWeddingEvent = initialState.joinWeddingEvent;
      state.leaveWeddingEvent = initialState.leaveWeddingEvent;
    },
  },
});
export const {
  createWeddingEventStart,
  createWeddingEventSuccess,
  createWeddingEventFailure,
  getWeddingEventStart,
  getWeddingEventSuccess,
  getWeddingEventFailure,
  setWeddingEventFromCheck,
  joinWeddingEventStart,
  joinWeddingEventSuccess,
  joinWeddingEventFailure,
  leaveWeddingEventStart,
  leaveWeddingEventSuccess,
  leaveWeddingEventFailure,
  clearWeddingEvent,
} = weddingEventSlice.actions;
export default weddingEventSlice.reducer;
