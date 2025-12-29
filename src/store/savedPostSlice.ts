import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as savedPostService from "../service/savedPostService";
import {
  SavedPost,
  SavePostData,
  UpdateSavedPostData,
} from "../service/savedPostService";

interface SavedPostState {
  savedPosts: SavedPost[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SavedPostState = {
  savedPosts: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchSavedPosts = createAsyncThunk(
  "savedPosts/fetchAll",
  async (
    {
      page = 1,
      limit = 20,
      albumId,
    }: { page?: number; limit?: number; albumId?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await savedPostService.getSavedPosts(page, limit, albumId);
      return data.savedPosts;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch saved posts");
    }
  }
);

export const saveNewPost = createAsyncThunk(
  "savedPosts/save",
  async (data: SavePostData, { rejectWithValue }) => {
    try {
      const savedPost = await savedPostService.savePost(data);
      return savedPost;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save post");
    }
  }
);

export const unsaveExistingPost = createAsyncThunk(
  "savedPosts/unsave",
  async (postId: string, { rejectWithValue }) => {
    try {
      await savedPostService.unsavePost(postId);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to unsave post");
    }
  }
);

export const checkIfPostSaved = createAsyncThunk(
  "savedPosts/check",
  async (postId: string, { rejectWithValue }) => {
    try {
      const data = await savedPostService.checkPostSaved(postId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to check post");
    }
  }
);

export const updateSavedPostData = createAsyncThunk(
  "savedPosts/update",
  async (
    { savedPostId, data }: { savedPostId: string; data: UpdateSavedPostData },
    { rejectWithValue }
  ) => {
    try {
      const updatedPost = await savedPostService.updateSavedPost(
        savedPostId,
        data
      );
      return updatedPost;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update saved post");
    }
  }
);

const savedPostSlice = createSlice({
  name: "savedPosts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch saved posts
      .addCase(fetchSavedPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchSavedPosts.fulfilled,
        (state, action: PayloadAction<SavedPost[]>) => {
          state.isLoading = false;
          state.savedPosts = action.payload;
        }
      )
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Save post
      .addCase(saveNewPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        saveNewPost.fulfilled,
        (state, action: PayloadAction<SavedPost>) => {
          state.isLoading = false;
          state.savedPosts.unshift(action.payload);
        }
      )
      .addCase(saveNewPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Unsave post
      .addCase(unsaveExistingPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        unsaveExistingPost.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.savedPosts = state.savedPosts.filter(
            (sp) => sp.postId._id !== action.payload
          );
        }
      )
      .addCase(unsaveExistingPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update saved post
      .addCase(updateSavedPostData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateSavedPostData.fulfilled,
        (state, action: PayloadAction<SavedPost>) => {
          state.isLoading = false;
          const index = state.savedPosts.findIndex(
            (sp) => sp._id === action.payload._id
          );
          if (index !== -1) {
            state.savedPosts[index] = action.payload;
          }
        }
      )
      .addCase(updateSavedPostData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = savedPostSlice.actions;
export default savedPostSlice.reducer;
