// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { configureStore, combineReducers, ThunkDispatch } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import logger from 'redux-logger';

// Keep alphabetically ordered
import authReducer from './reducers/auth';
import calendarReducer from './reducers/calendar';
import contactsReducer from './reducers/contacts';
import gabReducer from './reducers/gab';
import meReducer from './reducers/me';
import messagesReducer from './reducers/messages';
import notesReducer from './reducers/notes';
import settingsReducer from './reducers/settings';
import tasksReducer from './reducers/tasks';
import { userReducer as meatGrinder } from './reducers/user';
import alertsReducer from './reducers/alerts';
import foldersReducer from './reducers/folders';

const getMiddleware = (getDefaultMiddleware: any) => {
  const middleware = getDefaultMiddleware();
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV === 'development') {
    middleware.push(logger);
  }
  return middleware;
}

const rootReducer = combineReducers({
  alerts: alertsReducer,
  auth: authReducer,
  calendar: calendarReducer,
  contacts: contactsReducer,
  folders: foldersReducer,
  gab: gabReducer,
  me: meReducer,
  messages: messagesReducer,
  notes: notesReducer,
  settings: settingsReducer,
  tasks: tasksReducer,
  user: meatGrinder
});

// Create redux store
export const store = configureStore({
  reducer: rootReducer, 
  middleware: getMiddleware
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export const useTypeDispatch = () => useDispatch<ThunkDispatch<any, any, any>>();
export const useTypeSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
