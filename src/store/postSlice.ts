import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as postService from "../service/postService";
import {
  Post,
  CreatePostData,
  UpdatePostData,
  ReactToPostData,
} from "../service/postService";

interface PostState {
  posts: Post[];
  myPosts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  // ✅ Add pagination state
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const initialState: PostState = {
  posts: [],
  myPosts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  // ✅ Initialize pagination
  currentPage: 1,
  hasMore: true,
  isLoadingMore: false,
};

// Async thunks
// ✅ Update fetchAllPosts to support pagination
export const fetchAllPosts = createAsyncThunk(
  "posts/fetchAll",
  async (
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const data = await postService.getAllPosts(page, limit);
      return { ...data, requestedPage: page };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch posts");
    }
  }
);

export const fetchPostById = createAsyncThunk(
  "posts/fetchById",
  async (postId: string, { rejectWithValue }) => {
    try {
      const data = await postService.getPostById(postId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch post");
    }
  }
);

export const fetchMyPosts = createAsyncThunk(
  "posts/fetchMyPosts",
  async (_, { rejectWithValue }) => {
    try {
      const data = await postService.getMyPosts();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch my posts");
    }
  }
);

export const createNewPost = createAsyncThunk(
  "posts/create",
  async (postData: CreatePostData, { rejectWithValue }) => {
    try {
      const data = await postService.createPost(postData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create post");
    }
  }
);

export const updateExistingPost = createAsyncThunk(
  "posts/update",
  async (
    { postId, data }: { postId: string; data: UpdatePostData },
    { rejectWithValue }
  ) => {
    try {
      const updatedPost = await postService.updatePost(postId, data);
      return updatedPost;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update post");
    }
  }
);

export const deleteExistingPost = createAsyncThunk(
  "posts/delete",
  async (postId: string, { rejectWithValue }) => {
    try {
      await postService.deletePost(postId);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete post");
    }
  }
);

export const reactPost = createAsyncThunk(
  "posts/react",
  async (
    { postId, reactionType }: { postId: string; reactionType: "like" | "love" },
    { rejectWithValue }
  ) => {
    try {
      const data = await postService.reactToPost(postId, {
        type: reactionType,
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to react to post");
    }
  }
);

export const unreactPost = createAsyncThunk(
  "posts/unreact",
  async (postId: string, { rejectWithValue }) => {
    try {
      const data = await postService.unreactToPost(postId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to unreact to post");
    }
  }
);

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Update post in list after comment count changes
    updatePostCommentCount: (
      state,
      action: PayloadAction<{ postId: string; increment: number }>
    ) => {
      const { postId, increment } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        post.totalComments += increment;
      }
      if (state.currentPost && state.currentPost._id === postId) {
        state.currentPost.totalComments += increment;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all posts with pagination
      .addCase(fetchAllPosts.pending, (state, action) => {
        const isFirstPage =
          action.meta.arg?.page === 1 || !action.meta.arg?.page;
        if (isFirstPage) {
          state.isLoading = true;
        } else {
          state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;

        const { posts, pagination, requestedPage } = action.payload;

        if (requestedPage === 1) {
          // ✅ First page - replace all posts
          state.posts = posts;
        } else {
          // ✅ Load more - append new posts
          state.posts = [...state.posts, ...posts];
        }

        state.currentPage = pagination.page;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      // Fetch post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my posts
      .addCase(fetchMyPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myPosts = action.payload;
      })
      .addCase(fetchMyPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create post
      .addCase(createNewPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
        state.myPosts.unshift(action.payload);
      })
      .addCase(createNewPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update post
      .addCase(updateExistingPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        const myIndex = state.myPosts.findIndex(
          (p) => p._id === action.payload._id
        );
        if (myIndex !== -1) {
          state.myPosts[myIndex] = action.payload;
        }
        if (state.currentPost?._id === action.payload._id) {
          state.currentPost = action.payload;
        }
      })
      // Delete post
      .addCase(deleteExistingPost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
        state.myPosts = state.myPosts.filter((p) => p._id !== action.payload);
        if (state.currentPost?._id === action.payload) {
          state.currentPost = null;
        }
      })
      // React to post
      .addCase(reactPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost?._id === action.payload._id) {
          state.currentPost = action.payload;
        }
      })
      // Unreact to post
      .addCase(unreactPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost?._id === action.payload._id) {
          state.currentPost = action.payload;
        }
      });
  },
});

export const { clearCurrentPost, clearError, updatePostCommentCount } =
  postSlice.actions;
export default postSlice.reducer;
