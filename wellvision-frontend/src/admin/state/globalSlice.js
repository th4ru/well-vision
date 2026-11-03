import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "dark",
  userId: "63701cc1f03239b7f700000e", // Default user ID for admin
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
});

export const { setMode, setUserId } = globalSlice.actions;

export default globalSlice.reducer;