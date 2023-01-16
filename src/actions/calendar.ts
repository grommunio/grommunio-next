// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Event } from "microsoft-graph";
import { findIana } from "windows-iana";
import { AppContext } from "../azure/AppContext";
import { getUserWeekCalendar } from "../api/calendar";
import { FETCH_EVENTS_DATA } from "./types";


export const fetchEventsData = createAsyncThunk<
  Event[],
  AppContext
>(
  FETCH_EVENTS_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const ianaTimeZones = findIana(app.user?.timeZone!);
        const events = await getUserWeekCalendar(app.authProvider!, ianaTimeZones[0].valueOf());
        return events;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);
