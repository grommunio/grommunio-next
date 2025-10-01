// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AutomaticRepliesSetting, MailboxSettings, MessageRule, WorkingHours } from "microsoft-graph";
import type { RootState } from "../../store";
import * as settingsApi from "../../api/settings";
import * as rulesApi from "../../api/rules";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../actions/alerts";

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);
type ThunkApi = { state: RootState; rejectValue: string };

export type SettingsState = {
  // Follows the mailbox setting when available
  language: string;
  mailboxSettings: MailboxSettings;
  mailboxSettingsLoaded: boolean;
  rules: MessageRule[];
  rulesLoaded: boolean;
  timeZones: Array<{ alias: string; displayName: string }>;
  languages: Array<{ locale: string; displayName: string }>;
};

export const loadMailboxSettings = createAsyncThunk<MailboxSettings, void, ThunkApi>("settings/loadMailbox", async (_a, { rejectWithValue }) => {
  try { return await settingsApi.getMailboxSettings(); } catch (err) { return rejectWithValue(errorMessage(err)); }
});

export const saveMailboxSettings = createAsyncThunk<MailboxSettings, MailboxSettings, ThunkApi>("settings/saveMailbox", async (settings, { dispatch, rejectWithValue }) => {
  try {
    const result = await settingsApi.patchMailboxSettings(settings);
    dispatch(pushAlertStack({ message: "Settings saved", severity: "success" }));
    return result;
  } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const saveAutomaticReplies = createAsyncThunk<MailboxSettings, AutomaticRepliesSetting, ThunkApi>("settings/saveAutoReplies", async (setting, { dispatch, rejectWithValue }) => {
  try {
    const result = await settingsApi.patchAutomaticReplies(setting);
    dispatch(pushAlertStack({ message: "Automatic replies updated", severity: "success" }));
    return result;
  } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const saveWorkingHours = createAsyncThunk<MailboxSettings, WorkingHours, ThunkApi>("settings/saveWorkingHours", async (hours, { dispatch, rejectWithValue }) => {
  try {
    const result = await settingsApi.patchWorkingHours(hours);
    dispatch(pushAlertStack({ message: "Settings saved", severity: "success" }));
    return result;
  } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const loadTimeZones = createAsyncThunk<Array<{ alias: string; displayName: string }>, void, ThunkApi>("settings/loadTimeZones", async (_a, { rejectWithValue }) => {
  try { return await settingsApi.getSupportedTimeZones(); } catch (err) { return rejectWithValue(errorMessage(err)); }
}, { condition: (_a, { getState }) => getState().settings.timeZones.length === 0 });

export const loadRules = createAsyncThunk<MessageRule[], void, ThunkApi>("settings/loadRules", async (_a, { dispatch, rejectWithValue }) => {
  try { return await rulesApi.getMessageRules(); } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const createRule = createAsyncThunk<MessageRule, MessageRule, ThunkApi>("settings/createRule", async (rule, { dispatch, rejectWithValue }) => {
  try { return await rulesApi.createMessageRule(rule); } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const updateRule = createAsyncThunk<MessageRule, { id: string; rule: Partial<MessageRule> }, ThunkApi>("settings/updateRule", async ({ id, rule }, { dispatch, rejectWithValue }) => {
  try { return await rulesApi.updateMessageRule(id, rule); } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const deleteRule = createAsyncThunk<string, string, ThunkApi>("settings/deleteRule", async (id, { dispatch, rejectWithValue }) => {
  try { await rulesApi.deleteMessageRule(id); return id; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

const initialState: SettingsState = {
  language: window.localStorage.getItem("lang") || "en-US",
  mailboxSettings: {},
  mailboxSettingsLoaded: false,
  rules: [],
  rulesLoaded: false,
  timeZones: [],
  languages: [],
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
      window.localStorage.setItem("lang", action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMailboxSettings.fulfilled, (state, action) => { state.mailboxSettings = action.payload; state.mailboxSettingsLoaded = true; })
      .addCase(loadMailboxSettings.rejected, state => { state.mailboxSettingsLoaded = true; })
      .addCase(saveMailboxSettings.fulfilled, (state, action) => { state.mailboxSettings = { ...state.mailboxSettings, ...action.payload }; })
      .addCase(saveAutomaticReplies.fulfilled, (state, action) => { state.mailboxSettings = { ...state.mailboxSettings, ...action.payload }; })
      .addCase(saveWorkingHours.fulfilled, (state, action) => { state.mailboxSettings = { ...state.mailboxSettings, ...action.payload }; })
      .addCase(loadTimeZones.fulfilled, (state, action) => { state.timeZones = action.payload; })
      .addCase(loadRules.fulfilled, (state, action) => { state.rules = [...action.payload].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)); state.rulesLoaded = true; })
      .addCase(createRule.fulfilled, (state, action) => { state.rules.push(action.payload); })
      .addCase(updateRule.fulfilled, (state, action) => { state.rules = state.rules.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r); })
      .addCase(deleteRule.fulfilled, (state, action) => { state.rules = state.rules.filter(r => r.id !== action.payload); });
  },
});

export const { setLanguage } = settingsSlice.actions;
export default settingsSlice.reducer;
