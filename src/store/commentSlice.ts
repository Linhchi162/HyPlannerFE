import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as commentService from "../service/commentService";
import {
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from "../service/commentService";

interface CommentState {
  comments: Comment[];
  replies: { [commentId: string]: Comment[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentState = {
  comments: [],
  replies: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCommentsByPost = createAsyncThunk(
  "comments/fetchByPost",
  async (postId: string, { rejectWithValue }) => {
    try {
      const data = await commentService.getCommentsByPost(postId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch comments");
    }
  }
);

export const fetchRepliesByComment = createAsyncThunk(
  "comments/fetchReplies",
  async (commentId: string, { rejectWithValue }) => {
    try {
      const data = await commentService.getRepliesByComment(commentId);
      return { commentId, replies: data };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch replies");
    }
  }
);

export const createNewComment = createAsyncThunk(
  "comments/create",
  async (
    { postId, data }: { postId: string; data: CreateCommentData },
    { rejectWithValue }
  ) => {
    try {
      const comment = await commentService.createComment(postId, data);
      return comment;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create comment");
    }
  }
);

export const updateExistingComment = createAsyncThunk(
  "comments/update",
  async (
    { commentId, data }: { commentId: string; data: UpdateCommentData },
    { rejectWithValue }
  ) => {
    try {
      const comment = await commentService.updateComment(commentId, data);
      return comment;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update comment");
    }
  }
);

export const deleteExistingComment = createAsyncThunk(
  "comments/delete",
  async (commentId: string, { rejectWithValue }) => {
    try {
      await commentService.deleteComment(commentId);
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete comment");
    }
  }
);

export const reactComment = createAsyncThunk(
  "comments/react",
  async (
    {
      commentId,
      reactionType,
    }: { commentId: string; reactionType: "like" | "love" },
    { rejectWithValue }
  ) => {
    try {
      const comment = await commentService.reactToComment(commentId, {
        type: reactionType,
      });
      return comment;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to react to comment");
    }
  }
);

export const unreactComment = createAsyncThunk(
  "comments/unreact",
  async (commentId: string, { rejectWithValue }) => {
    try {
      const comment = await commentService.unreactToComment(commentId);
      return comment;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to unreact to comment");
    }
  }
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = [];
      state.replies = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments by post
      .addCase(fetchCommentsByPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchCommentsByPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch replies by comment
      .addCase(fetchRepliesByComment.fulfilled, (state, action) => {
        state.replies[action.payload.commentId] = action.payload.replies;
      })
      // Create comment
      .addCase(createNewComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewComment.fulfilled, (state, action) => {
        state.isLoading = false;
        // If it's a reply, add to replies, otherwise add to comments
        if (action.payload.parentCommentId) {
          const parentId = action.payload.parentCommentId;
          if (!state.replies[parentId]) {
            state.replies[parentId] = [];
          }
          state.replies[parentId].push(action.payload);

          // Update totalReplies count in parent comment
          const parentComment = state.comments.find((c) => c._id === parentId);
          if (parentComment) {
            parentComment.totalReplies += 1;
          }
        } else {
          state.comments.push(action.payload);
        }
      })
      .addCase(createNewComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update comment
      .addCase(updateExistingComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
        // Also check in replies
        Object.keys(state.replies).forEach((parentId) => {
          const replyIndex = state.replies[parentId].findIndex(
            (c) => c._id === action.payload._id
          );
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex] = action.payload;
          }
        });
      })
      // Delete comment
      .addCase(deleteExistingComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c._id !== action.payload);
        // Also remove from replies
        Object.keys(state.replies).forEach((parentId) => {
          state.replies[parentId] = state.replies[parentId].filter(
            (c) => c._id !== action.payload
          );
        });
      })
      // React to comment
      .addCase(reactComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
        // Also update in replies
        Object.keys(state.replies).forEach((parentId) => {
          const replyIndex = state.replies[parentId].findIndex(
            (c) => c._id === action.payload._id
          );
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex] = action.payload;
          }
        });
      })
      // Unreact to comment
      .addCase(unreactComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
        // Also update in replies
        Object.keys(state.replies).forEach((parentId) => {
          const replyIndex = state.replies[parentId].findIndex(
            (c) => c._id === action.payload._id
          );
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex] = action.payload;
          }
        });
      });
  },
});

export const { clearComments, clearError } = commentSlice.actions;
export default commentSlice.reducer;
