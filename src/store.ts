// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import logger from 'redux-logger';

// Keep alphabetically ordered
import authReducer from './reducers/auth';
import calendarReducer from './reducers/calendar';
import messagesReducer from './reducers/messages';
import tasksReducer from './reducers/tasks';
import { userReducer as meatGrinder } from './reducers/user';

const rootReducer = combineReducers({
  auth: authReducer,
  calendar: calendarReducer,
  messages: messagesReducer,
  tasks: tasksReducer,
  user: meatGrinder
});

// Create redux store
export const store = configureStore({
  reducer: rootReducer, 
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat([logger])
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useTypeDispatch = () => useDispatch<AppDispatch>();
export const useTypeSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
