// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Event } from "microsoft-graph";
import { findIana } from "windows-iana";
import { AppContext } from "../azure/AppContext";
import {
  deleteEvent,
  getUserWeekCalendar,
  patchEvent,
  postEvent,
  getUserCalendars,
  getUserCalendersEvent,
  getUserCalendersEventByID
} from "../api/calendar";
import { FETCH_EVENTS_DATA, POST_EVENT_DATA, PATCH_EVENT_DATA, FETCH_USER_CALENDER_DATA, FETCH_USER_CALENDERS_EVENTS_DATA } from "./types";
import { defaultFetchHandler, defaultPostHandler } from "./defaults";


type calendarAppContext ={
  app:AppContext,
  id?:string
}
export const fetchEventsData = createAsyncThunk<
  Event[],
  calendarAppContext
>(
  FETCH_EVENTS_DATA,
  async ({app, id}: calendarAppContext) => {
    if (app.user) {
      try {
        const ianaTimeZones = findIana(app.user?.timeZone!);
        const events = await getUserWeekCalendar(app.authProvider!, ianaTimeZones[0].valueOf(),id);
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
  event: Event,
}
export function postEventData(event: Event) {
  return defaultPostHandler(postEvent, POST_EVENT_DATA, ...[formatEvent(event)])
}

export const patchEventData = createAsyncThunk<
  Event | boolean,
  postEventDataParams
>(
  PATCH_EVENT_DATA,
  async ({ event }: postEventDataParams) => {
    try {
      const res = await patchEvent(formatEvent(event));
      return res;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      return false;
    }
    return false;
  }
);


type deleteEventDataParams = {
  eventId: string,
}

export const deleteEventData = createAsyncThunk<
  Event | boolean,
  deleteEventDataParams
>(
  PATCH_EVENT_DATA,
  async ({ eventId }: deleteEventDataParams) => {
    try {
      const res = await deleteEvent(eventId);
      return res;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      return false;
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
  };
}

export function fetchUserCalenders() {
  return defaultFetchHandler(getUserCalendars, FETCH_USER_CALENDER_DATA)
}

export function fetchUserCalendersEvents() {
  return defaultFetchHandler(getUserCalendersEvent, FETCH_USER_CALENDERS_EVENTS_DATA)
}

type fetchUserCalendersEventsByIDParams = {
  id: string,
}

export const fetchUserCalendersEventsByID = createAsyncThunk(
  FETCH_USER_CALENDERS_EVENTS_DATA,
  async ({ id }: fetchUserCalendersEventsByIDParams) => {
    try {
      const res = await getUserCalendersEventByID(id);
      return res;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      return false;
    }
  }
);
