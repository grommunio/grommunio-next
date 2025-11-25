// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import logger from 'redux-logger';

// Keep alphabetically ordered
import calendarReducer from './features/calendar/calendarSlice';
import contactsReducer from './features/contacts/contactsSlice';
import notesReducer from './features/notes/notesSlice';
import settingsReducer from './features/settings/settingsSlice';
import tasksReducer from './features/tasks/tasksSlice';
import alertsReducer from './features/alerts/alertsSlice';
import sessionReducer from './features/session/sessionSlice';
import mailReducer from './features/mail/mailSlice';

const rootReducer = combineReducers({
  alerts: alertsReducer,
  calendar: calendarReducer,
  contacts: contactsReducer,
  mail: mailReducer,
  notes: notesReducer,
  session: sessionReducer,
  settings: settingsReducer,
  tasks: tasksReducer,
});

// Create redux store
export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => import.meta.env.DEV ? getDefaultMiddleware().concat(logger) : getDefaultMiddleware(),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useTypeDispatch: () => AppDispatch = useDispatch;
export const useTypeSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
