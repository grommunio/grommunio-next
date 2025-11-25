// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "microsoft-graph";

export type SessionState = {
  authenticated: boolean;
  me: User;
};

const initialState: SessionState = {
  authenticated: false,
  me: {},
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setMe(state, action: PayloadAction<User | null>) {
      state.me = action.payload || {};
      state.authenticated = Boolean(action.payload);
    },
  },
});

export const { setMe } = sessionSlice.actions;
export default sessionSlice.reducer;
