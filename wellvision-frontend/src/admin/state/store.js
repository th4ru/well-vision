import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";  // import your api.js
import globalReducer from "./globalSlice";

export const store = configureStore({
  reducer: {
    global: globalReducer,
    [api.reducerPath]: api.reducer,  // add API reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),  // add API middleware
});
