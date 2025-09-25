import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    //Reducer để cập nhật một trường dữ liệu của user
    updateUserField(state, action) {
      const { field, value } = action.payload;
      if (state.user) {
        // Cập nhật trường tương ứng trong state.currentUser
        // Sử dụng bracket notation để cập nhật key động
        state.user[field] = value;
      }
    },
  },
});

export const { setCredentials, logout, updateUserField } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) =>
  state.auth.token;
