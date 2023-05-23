// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Calendar, Event } from "microsoft-graph";
import { findIana } from "windows-iana";
import { AppContext } from "../azure/AppContext";
import { deleteEvent, getUserWeekCalendar, getAvailableCalendars ,patchEvent, postEvent } from "../api/calendar";
import { FETCH_EVENTS_DATA, POST_EVENT_DATA, PATCH_EVENT_DATA, FETCH_USER_CALENDER } from "./types";

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

export const fetchAvailableCalendars = createAsyncThunk<
  Calendar[],
  AppContext
>(
  FETCH_USER_CALENDER,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const events = await getAvailableCalendars(app.authProvider!);
        return events;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

type postEventDataParams = {
  app: AppContext,
  event: Event,
}

export const postEventData = createAsyncThunk<
  Event | boolean,
  postEventDataParams
  >(
    POST_EVENT_DATA,
    async ({ event, app }: postEventDataParams) => {
      if (app.user) {
        try {
          const res = await postEvent(app.authProvider!, formatEvent(event));
          return res;
        } catch (err) {
          const error = err as Error;
          console.error(error);
          app.displayError!(error.message);
          return false;
        }
      }
      return false;
    }
  );

export const patchEventData = createAsyncThunk<
  Event | boolean,
  postEventDataParams
  >(
    PATCH_EVENT_DATA,
    async ({ event, app }: postEventDataParams) => {
      if (app.user) {
        try {
          const res = await patchEvent(app.authProvider!, formatEvent(event));
          return res;
        } catch (err) {
          const error = err as Error;
          console.error(error);
          app.displayError!(error.message);
          return false;
        }
      }
      return false;
    }
  );


type deleteEventDataParams = {
  app: AppContext,
  eventId: string,
}

export const deleteEventData = createAsyncThunk<
  Event | boolean,
  deleteEventDataParams
  >(
    PATCH_EVENT_DATA,
    async ({ eventId, app }: deleteEventDataParams) => {
      if (app.user) {
        try {
          const res = await deleteEvent(app.authProvider!, eventId);
          return res;
        } catch (err) {
          const error = err as Error;
          console.error(error);
          app.displayError!(error.message);
          return false;
        }
      }
      return false;
    }
  );


function formatEvent(rawEvent: any): Event {
  const { id, subject, location, notes, startDate, endDate } = rawEvent;
  return {
    id,
    subject,
    body: {
      contentType: "text",
      content: notes,
    },
    start: {
      dateTime: startDate,
      timeZone: 'Europe/Berlin'  // TODO: Remove hardcoded timezone
    },
    end: {
      dateTime: endDate,
      timeZone: 'Europe/Berlin'  // TODO: Remove hardcoded timezone
    },
    location: {
      displayName: location,
    },
  }
}
