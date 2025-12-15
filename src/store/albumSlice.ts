import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as albumService from "../service/albumService";
import {
  Album,
  CreateAlbumData,
  UpdateAlbumData,
} from "../service/albumService";

interface AlbumState {
  albums: Album[];
  myAlbums: Album[];
  myPublicAlbums: Album[];
  featuredAlbums: Album[];
  currentAlbum: Album | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlbumState = {
  albums: [],
  myAlbums: [],
  myPublicAlbums: [],
  featuredAlbums: [],
  currentAlbum: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAllAlbums = createAsyncThunk(
  "albums/fetchAll",
  async (
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await albumService.getAllAlbums(page, limit);
      return data.albums;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch albums");
    }
  }
);

export const fetchMyAlbums = createAsyncThunk(
  "albums/fetchMyAlbums",
  async (_, { rejectWithValue }) => {
    try {
      const data = await albumService.getMyAlbums();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch my albums");
    }
  }
);

export const fetchMyPublicAlbums = createAsyncThunk(
  "albums/fetchMyPublicAlbums",
  async (_, { rejectWithValue }) => {
    try {
      const data = await albumService.getMyPublicAlbums();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch my public albums"
      );
    }
  }
);

export const fetchFeaturedAlbums = createAsyncThunk(
  "albums/fetchFeatured",
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const data = await albumService.getFeaturedAlbums(limit);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch featured albums"
      );
    }
  }
);

export const fetchAlbumById = createAsyncThunk(
  "albums/fetchById",
  async (albumId: string, { rejectWithValue }) => {
    try {
      const data = await albumService.getAlbumById(albumId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch album");
    }
  }
);

export const createNewAlbum = createAsyncThunk(
  "albums/create",
  async (albumData: CreateAlbumData, { rejectWithValue }) => {
    try {
      const data = await albumService.createAlbum(albumData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create album");
    }
  }
);

export const updateExistingAlbum = createAsyncThunk(
  "albums/update",
  async (
    { albumId, data }: { albumId: string; data: UpdateAlbumData },
    { rejectWithValue }
  ) => {
    try {
      const updatedAlbum = await albumService.updateAlbum(albumId, data);
      return updatedAlbum;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update album");
    }
  }
);

export const deleteExistingAlbum = createAsyncThunk(
  "albums/delete",
  async (albumId: string, { rejectWithValue }) => {
    try {
      await albumService.deleteAlbum(albumId);
      return albumId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete album");
    }
  }
);

export const publishAlbumThunk = createAsyncThunk(
  "albums/publish",
  async (
    { albumId, isPublic }: { albumId: string; isPublic: boolean },
    { rejectWithValue }
  ) => {
    try {
      const album = await albumService.publishAlbum(albumId, isPublic);
      return album;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to publish album");
    }
  }
);

export const addSelection = createAsyncThunk(
  "albums/addSelection",
  async (
    { albumId, selectionId }: { albumId: string; selectionId: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await albumService.addSelectionToAlbum(albumId, selectionId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add selection");
    }
  }
);

export const removeSelection = createAsyncThunk(
  "albums/removeSelection",
  async (
    { albumId, selectionId }: { albumId: string; selectionId: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await albumService.removeSelectionFromAlbum(
        albumId,
        selectionId
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove selection");
    }
  }
);

const albumSlice = createSlice({
  name: "albums",
  initialState,
  reducers: {
    clearCurrentAlbum: (state) => {
      state.currentAlbum = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all albums
      .addCase(fetchAllAlbums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAllAlbums.fulfilled,
        (state, action: PayloadAction<Album[]>) => {
          state.isLoading = false;
          state.albums = action.payload;
        }
      )
      .addCase(fetchAllAlbums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch my albums
      .addCase(fetchMyAlbums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMyAlbums.fulfilled,
        (state, action: PayloadAction<Album[]>) => {
          state.isLoading = false;
          state.myAlbums = action.payload;
        }
      )
      .addCase(fetchMyAlbums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch my public albums
      .addCase(fetchMyPublicAlbums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMyPublicAlbums.fulfilled,
        (state, action: PayloadAction<Album[]>) => {
          state.isLoading = false;
          state.myPublicAlbums = action.payload;
        }
      )
      .addCase(fetchMyPublicAlbums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch featured albums
      .addCase(fetchFeaturedAlbums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchFeaturedAlbums.fulfilled,
        (state, action: PayloadAction<Album[]>) => {
          state.isLoading = false;
          state.featuredAlbums = action.payload;
        }
      )
      .addCase(fetchFeaturedAlbums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch album by ID
      .addCase(fetchAlbumById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAlbumById.fulfilled,
        (state, action: PayloadAction<Album>) => {
          state.isLoading = false;
          state.currentAlbum = action.payload;
        }
      )
      .addCase(fetchAlbumById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create album
      .addCase(createNewAlbum.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createNewAlbum.fulfilled,
        (state, action: PayloadAction<Album>) => {
          state.isLoading = false;
          state.albums.unshift(action.payload);
          state.myAlbums.unshift(action.payload);
        }
      )
      .addCase(createNewAlbum.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update album
      .addCase(updateExistingAlbum.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateExistingAlbum.fulfilled,
        (state, action: PayloadAction<Album>) => {
          state.isLoading = false;
          const index = state.albums.findIndex(
            (a) => a._id === action.payload._id
          );
          if (index !== -1) {
            state.albums[index] = action.payload;
          }
          const myIndex = state.myAlbums.findIndex(
            (a) => a._id === action.payload._id
          );
          if (myIndex !== -1) {
            state.myAlbums[myIndex] = action.payload;
          }
          if (state.currentAlbum?._id === action.payload._id) {
            state.currentAlbum = action.payload;
          }
        }
      )
      .addCase(updateExistingAlbum.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete album
      .addCase(deleteExistingAlbum.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteExistingAlbum.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.albums = state.albums.filter((a) => a._id !== action.payload);
          state.myAlbums = state.myAlbums.filter(
            (a) => a._id !== action.payload
          );
          state.myPublicAlbums = state.myPublicAlbums.filter(
            (a) => a._id !== action.payload
          );
        }
      )
      .addCase(deleteExistingAlbum.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Publish album
      .addCase(publishAlbumThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        publishAlbumThunk.fulfilled,
        (state, action: PayloadAction<Album>) => {
          state.isLoading = false;
          // Update album in all arrays
          const updateAlbum = (albums: Album[]) => {
            const index = albums.findIndex((a) => a._id === action.payload._id);
            if (index !== -1) {
              albums[index] = action.payload;
            }
          };

          updateAlbum(state.albums);
          updateAlbum(state.myAlbums);

          // If published, add to myPublicAlbums; if unpublished, remove from it
          if (action.payload.isPublic) {
            const existsInPublic = state.myPublicAlbums.some(
              (a) => a._id === action.payload._id
            );
            if (!existsInPublic) {
              state.myPublicAlbums.push(action.payload);
            } else {
              updateAlbum(state.myPublicAlbums);
            }
          } else {
            state.myPublicAlbums = state.myPublicAlbums.filter(
              (a) => a._id !== action.payload._id
            );
          }

          if (state.currentAlbum?._id === action.payload._id) {
            state.currentAlbum = action.payload;
          }
        }
      )
      .addCase(publishAlbumThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Add selection
      .addCase(
        addSelection.fulfilled,
        (state, action: PayloadAction<Album>) => {
          if (state.currentAlbum?._id === action.payload._id) {
            state.currentAlbum = action.payload;
          }
        }
      )

      // Remove selection
      .addCase(
        removeSelection.fulfilled,
        (state, action: PayloadAction<Album>) => {
          if (state.currentAlbum?._id === action.payload._id) {
            state.currentAlbum = action.payload;
          }
        }
      );
  },
});

export const { clearCurrentAlbum, clearError } = albumSlice.actions;
export default albumSlice.reducer;
