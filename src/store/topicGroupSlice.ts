import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as topicGroupService from "../service/topicGroupService";
import {
  TopicGroup,
  CreateTopicGroupData,
  UpdateTopicGroupData,
} from "../service/topicGroupService";

interface TopicGroupState {
  groups: TopicGroup[];
  myGroups: TopicGroup[];
  currentGroup: TopicGroup | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TopicGroupState = {
  groups: [],
  myGroups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAllTopicGroups = createAsyncThunk(
  "topicGroups/fetchAll",
  async (
    {
      page = 1,
      limit = 20,
      category,
      search,
    }: { page?: number; limit?: number; category?: string; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await topicGroupService.getAllTopicGroups(
        page,
        limit,
        category,
        search
      );
      return data.groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch topic groups");
    }
  }
);

export const fetchTopicGroupById = createAsyncThunk(
  "topicGroups/fetchById",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const data = await topicGroupService.getTopicGroupById(groupId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch topic group");
    }
  }
);

export const fetchMyTopicGroups = createAsyncThunk(
  "topicGroups/fetchMyGroups",
  async (_, { rejectWithValue }) => {
    try {
      const data = await topicGroupService.getMyTopicGroups();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch my groups");
    }
  }
);

export const createNewTopicGroup = createAsyncThunk(
  "topicGroups/create",
  async (groupData: CreateTopicGroupData, { rejectWithValue }) => {
    try {
      const data = await topicGroupService.createTopicGroup(groupData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create topic group");
    }
  }
);

export const updateExistingTopicGroup = createAsyncThunk(
  "topicGroups/update",
  async (
    { groupId, data }: { groupId: string; data: UpdateTopicGroupData },
    { rejectWithValue }
  ) => {
    try {
      const updatedGroup = await topicGroupService.updateTopicGroup(
        groupId,
        data
      );
      return updatedGroup;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update topic group");
    }
  }
);

export const deleteExistingTopicGroup = createAsyncThunk(
  "topicGroups/delete",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await topicGroupService.deleteTopicGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete topic group");
    }
  }
);

export const joinGroup = createAsyncThunk(
  "topicGroups/join",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const data = await topicGroupService.joinTopicGroup(groupId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to join group");
    }
  }
);

export const leaveGroup = createAsyncThunk(
  "topicGroups/leave",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await topicGroupService.leaveTopicGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to leave group");
    }
  }
);

const topicGroupSlice = createSlice({
  name: "topicGroups",
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all groups
      .addCase(fetchAllTopicGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAllTopicGroups.fulfilled,
        (state, action: PayloadAction<TopicGroup[]>) => {
          state.isLoading = false;
          state.groups = action.payload;
        }
      )
      .addCase(fetchAllTopicGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch group by ID
      .addCase(fetchTopicGroupById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchTopicGroupById.fulfilled,
        (state, action: PayloadAction<TopicGroup>) => {
          state.isLoading = false;
          state.currentGroup = action.payload;
        }
      )
      .addCase(fetchTopicGroupById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch my groups
      .addCase(fetchMyTopicGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMyTopicGroups.fulfilled,
        (state, action: PayloadAction<TopicGroup[]>) => {
          state.isLoading = false;
          state.myGroups = action.payload;
        }
      )
      .addCase(fetchMyTopicGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create group
      .addCase(createNewTopicGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createNewTopicGroup.fulfilled,
        (state, action: PayloadAction<TopicGroup>) => {
          state.isLoading = false;
          state.groups.unshift(action.payload);
          state.myGroups.unshift(action.payload);
        }
      )
      .addCase(createNewTopicGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update group
      .addCase(updateExistingTopicGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateExistingTopicGroup.fulfilled,
        (state, action: PayloadAction<TopicGroup>) => {
          state.isLoading = false;
          const index = state.groups.findIndex(
            (g) => g._id === action.payload._id
          );
          if (index !== -1) {
            state.groups[index] = action.payload;
          }
          if (state.currentGroup?._id === action.payload._id) {
            state.currentGroup = action.payload;
          }
        }
      )
      .addCase(updateExistingTopicGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete group
      .addCase(deleteExistingTopicGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteExistingTopicGroup.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.groups = state.groups.filter((g) => g._id !== action.payload);
          state.myGroups = state.myGroups.filter(
            (g) => g._id !== action.payload
          );
        }
      )
      .addCase(deleteExistingTopicGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Join group
      .addCase(joinGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        joinGroup.fulfilled,
        (state, action: PayloadAction<TopicGroup>) => {
          state.isLoading = false;
          const index = state.groups.findIndex(
            (g) => g._id === action.payload._id
          );
          if (index !== -1) {
            state.groups[index] = action.payload;
          }
          if (state.currentGroup?._id === action.payload._id) {
            state.currentGroup = action.payload;
          }
          // Thêm vào myGroups nếu chưa có
          if (!state.myGroups.find((g) => g._id === action.payload._id)) {
            state.myGroups.push(action.payload);
          }
        }
      )
      .addCase(joinGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Leave group
      .addCase(leaveGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.myGroups = state.myGroups.filter((g) => g._id !== action.payload);
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentGroup, clearError } = topicGroupSlice.actions;
export default topicGroupSlice.reducer;
