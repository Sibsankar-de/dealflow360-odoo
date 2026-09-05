import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserResponseType } from "@/types/auth";

export interface UserState {
  user: UserResponseType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserResponseType | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = userSlice.actions;

export default userSlice.reducer;
