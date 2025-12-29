import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  rememberMe: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User | null;
        token: string | null;
        rememberMe?: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.rememberMe !== undefined) {
        state.rememberMe = action.payload.rememberMe;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.rememberMe = false;
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
export const selectRememberMe = (state: { auth: AuthState }) =>
  state.auth.rememberMe;
