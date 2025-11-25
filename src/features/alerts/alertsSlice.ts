// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AlertType } from "../../types/misc";

type AlertsState = { stack: AlertType[] };

const initialState: AlertsState = { stack: [] };

let counter = 0;

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    pushAlert: {
      reducer(state, action: PayloadAction<AlertType>) {
        // Don't stack repeats
        const last = state.stack[state.stack.length - 1];
        if (last && last.message === action.payload.message && last.severity === action.payload.severity && !action.payload.undo) return;
        state.stack.push(action.payload);
        if (state.stack.length > 5) state.stack.shift();
      },
      prepare(alert?: Partial<AlertType>) {
        return { payload: { severity: "success" as const, ...(alert || {}), message: alert?.message || "Success", id: Date.now() * 100 + (counter++ % 100) } };
      },
    },
    removeAlert(state, action: PayloadAction<number>) {
      state.stack = state.stack.filter(alert => alert.id !== action.payload);
    },
  },
});

export const { pushAlert, removeAlert } = alertsSlice.actions;
// Old name, still used everywhere
export const pushAlertStack = pushAlert;
export const spliceAlertStack = removeAlert;
export default alertsSlice.reducer;
