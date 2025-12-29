import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as guestService from "../service/guestService";
import { Guest, GuestStats, TableSuggestion } from "../service/guestService";

interface GuestState {
  guests: Guest[];
  stats: GuestStats | null;
  tableSuggestions: TableSuggestion | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GuestState = {
  guests: [],
  stats: null,
  tableSuggestions: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchGuestsByWeddingEvent = createAsyncThunk(
  "guests/fetchByWeddingEvent",
  async (
    {
      weddingEventId,
      filters,
    }: {
      weddingEventId: string;
      filters?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.getGuestsByWeddingEvent(
        weddingEventId,
        filters
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tải danh sách khách mời"
      );
    }
  }
);

export const createNewGuest = createAsyncThunk(
  "guests/create",
  async (data: Partial<Guest>, { rejectWithValue }) => {
    try {
      return await guestService.createGuest(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tạo khách mời"
      );
    }
  }
);

export const updateExistingGuest = createAsyncThunk(
  "guests/update",
  async (
    { guestId, data }: { guestId: string; data: Partial<Guest> },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.updateGuest(guestId, data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật khách mời"
      );
    }
  }
);

export const deleteExistingGuest = createAsyncThunk(
  "guests/delete",
  async (guestId: string, { rejectWithValue }) => {
    try {
      await guestService.deleteGuest(guestId);
      return guestId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi xóa khách mời"
      );
    }
  }
);

export const updateGuestAttendance = createAsyncThunk(
  "guests/updateAttendance",
  async (
    { guestId, status }: { guestId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.updateAttendanceStatus(guestId, status);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật trạng thái"
      );
    }
  }
);

export const updateGuestGift = createAsyncThunk(
  "guests/updateGift",
  async (
    {
      guestId,
      gift,
    }: {
      guestId: string;
      gift: {
        type: string;
        amount?: number;
        description?: string;
        receivedDate?: string;
        receivedMethod?: string;
        returnedGift?: boolean;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.updateGift(guestId, gift);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật quà mừng"
      );
    }
  }
);

export const fetchTableSuggestions = createAsyncThunk(
  "guests/fetchTableSuggestions",
  async (
    {
      weddingEventId,
      guestsPerTable,
    }: { weddingEventId: string; guestsPerTable?: number },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.getTableSuggestions(
        weddingEventId,
        guestsPerTable
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tính toán gợi ý bàn tiệc"
      );
    }
  }
);

export const importGuestList = createAsyncThunk(
  "guests/import",
  async (
    {
      weddingEventId,
      guests,
    }: { weddingEventId: string; guests: Partial<Guest>[] },
    { rejectWithValue }
  ) => {
    try {
      return await guestService.importGuests(weddingEventId, guests);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi import danh sách"
      );
    }
  }
);

const guestSlice = createSlice({
  name: "guests",
  initialState,
  reducers: {
    clearGuestError: (state) => {
      state.error = null;
    },
    clearGuests: (state) => {
      state.guests = [];
      state.stats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch guests
      .addCase(fetchGuestsByWeddingEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGuestsByWeddingEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.guests = action.payload.guests;
        state.stats = action.payload.stats;
      })
      .addCase(fetchGuestsByWeddingEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create guest
      .addCase(createNewGuest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewGuest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.guests.unshift(action.payload);
      })
      .addCase(createNewGuest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update guest
      .addCase(updateExistingGuest.fulfilled, (state, action) => {
        const index = state.guests.findIndex(
          (g) => g._id === action.payload._id
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      // Delete guest
      .addCase(deleteExistingGuest.fulfilled, (state, action) => {
        state.guests = state.guests.filter((g) => g._id !== action.payload);
      })
      // Update attendance
      .addCase(updateGuestAttendance.fulfilled, (state, action) => {
        const index = state.guests.findIndex(
          (g) => g._id === action.payload._id
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      // Update gift
      .addCase(updateGuestGift.fulfilled, (state, action) => {
        const index = state.guests.findIndex(
          (g) => g._id === action.payload._id
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      // Table suggestions
      .addCase(fetchTableSuggestions.fulfilled, (state, action) => {
        state.tableSuggestions = action.payload;
      })
      // Import guests
      .addCase(importGuestList.fulfilled, (state, action) => {
        state.guests = [...state.guests, ...action.payload];
      });
  },
});

export const { clearGuestError, clearGuests } = guestSlice.actions;
export default guestSlice.reducer;
