import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import invitationClient from "../api/invitationClient";
import type { RootState } from "./store";

export const fetchUserInvitation = createAsyncThunk(
  "invitation/fetchUserInvitation",
  async (_, { rejectWithValue }) => {
    try {
      const response = await invitationClient.get("/invitation/my-invitation");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Unknown error"
      );
    }
  }
);

const invitationSlice = createSlice({
  name: "invitation",
  initialState: {
    data: null, // Sẽ chứa dữ liệu website nếu có
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null as string | null | unknown, // Type an toàn hơn cho error
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInvitation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserInvitation.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload; // Lưu dữ liệu (hoặc null) vào state
      })
      .addCase(fetchUserInvitation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const selectUserInvitation = (state: RootState) => state.invitation.data;
// ---------------------------------------------

export default invitationSlice.reducer;
