// // store/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import phaseReducer from "./phaseSlice";
import taskReducer from "./taskSlice";
import weddingEventReducer from "./weddingEventSlice";
import groupActivityReducer from "./groupActivitySlice";
import activityReducer from "./activitySlice";
import invitationReducer from "./invitationSlice";
import authReducer from "./authSlice";
import feedbackReducer from "./feedbackSlice";
import postReducer from "./postSlice";
import commentReducer from "./commentSlice";
import guestReducer from "./guestSlice";
import topicGroupReducer from "./topicGroupSlice";
import albumReducer from "./albumSlice";
import savedPostReducer from "./savedPostSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rootReducer = combineReducers({
  phases: phaseReducer,
  tasks: taskReducer,
  weddingEvent: weddingEventReducer,
  groupActivities: groupActivityReducer,
  activities: activityReducer,
  auth: authReducer,
  invitation: invitationReducer,
  feedback: feedbackReducer,
  posts: postReducer,
  comments: commentReducer,
  guests: guestReducer,
  topicGroups: topicGroupReducer,
  albums: albumReducer,
  savedPosts: savedPostReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth"], // chỉ persist auth
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
