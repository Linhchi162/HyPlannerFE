import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Member } from "./weddingEventSlice";

export interface Task {
  _id: string;
  taskName: string;
  taskNote: string;
  // expectedBudget: number;
  // actualBudget?: number;
  member: Member[];
  completed: boolean;
}
interface GetTasksState {
  tasks?: Task[];
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface GetTaskInfoState {
  task?: Task;
  isLoading: boolean;
  error: boolean;
  errorMsg: string;
}
interface TaskSliceState {
  getTasks: GetTasksState;
  createTask: GetTasksState;
  deleteTask: GetTasksState;
  editTask: GetTasksState;
  getTaskInfo: GetTaskInfoState;
}
const initialState: TaskSliceState = {
  getTasks: {
    tasks: [],
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  createTask: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  deleteTask: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  editTask: {
    isLoading: false,
    error: false,
    errorMsg: "",
  },
  getTaskInfo: {
    task: undefined,
    isLoading: false,
    error: false,
    errorMsg: "",
  },
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    getTasksStart: (state) => {
      state.getTasks.isLoading = true;
    },
    getTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      state.getTasks.isLoading = false;
      state.getTasks.tasks = action.payload;
      state.getTasks.error = false;
    },
    getTasksFailure: (state, action: PayloadAction<string>) => {
      state.getTasks.isLoading = false;
      state.getTasks.error = true;
      state.getTasks.errorMsg = action.payload;
    },
    // Create task
    createTaskStart: (state) => {
      state.createTask.isLoading = true;
    },
    createTaskSuccess: (state) => {
      state.createTask.isLoading = false;
      state.createTask.error = false;
    },
    createTaskFailure: (state, action: PayloadAction<string>) => {
      state.createTask.isLoading = false;
      state.createTask.error = true;
      state.createTask.errorMsg = action.payload;
    },
    // Delete task
    deleteTaskStart: (state) => {
      state.deleteTask.isLoading = true;
    },
    deleteTaskSuccess: (state) => {
      state.deleteTask.isLoading = false;
      state.deleteTask.error = false;
    },
    deleteTaskFailure: (state, action: PayloadAction<string>) => {
      state.deleteTask.isLoading = false;
      state.deleteTask.error = true;
      state.deleteTask.errorMsg = action.payload;
    },
    // Edit task
    editTaskStart: (state) => {
      state.editTask.isLoading = true;
    },
    editTaskSuccess: (state) => {
      state.editTask.isLoading = false;
      state.editTask.error = false;
    },
    editTaskFailure: (state, action: PayloadAction<string>) => {
      state.editTask.isLoading = false;
      state.editTask.error = true;
      state.editTask.errorMsg = action.payload;
    },
    // Get task info
    getTaskInfoStart: (state) => {
      state.getTaskInfo.isLoading = true;
    },
    getTaskInfoSuccess: (state, action: PayloadAction<Task>) => {
      state.getTaskInfo.isLoading = false;
      state.getTaskInfo.task = action.payload;
      state.getTaskInfo.error = false;
    },
    getTaskInfoFailure: (state, action: PayloadAction<string>) => {
      state.getTaskInfo.isLoading = false;
      state.getTaskInfo.error = true;
      state.getTaskInfo.errorMsg = action.payload;
    },
  },
});
export const {
  getTasksStart,
  getTasksSuccess,
  getTasksFailure,
  createTaskStart,
  createTaskSuccess,
  createTaskFailure,
  deleteTaskStart,
  deleteTaskSuccess,
  deleteTaskFailure,
  editTaskStart,
  editTaskSuccess,
  editTaskFailure,
  getTaskInfoStart,
  getTaskInfoSuccess,
  getTaskInfoFailure,
} = taskSlice.actions;
export default taskSlice.reducer;
