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
  patchUserCalendar,
  createUserCalendar,
  deleteUserCalendar
} from "../api/calendar";
import {
  FETCH_EVENTS_DATA,
  POST_EVENT_DATA,
  PATCH_EVENT_DATA,
  FETCH_USER_CALENDER_DATA,
  PATCH_CALENDAR_DATA,
  POST_CALENDAR_DATA,
  DELETE_CALENDAR_DATA,
  DELETE_EVENT_DATA,
} from "./types";
import {
  defaultFetchHandler,
  defaultPostHandler,
  defaultPatchHandler,
  defaultDeleteHandler
} from "./defaults";

type calendarAppContext = {
  app: AppContext;
  id?: string;
};
export const fetchEventsData = createAsyncThunk<Event[], calendarAppContext>(
  FETCH_EVENTS_DATA,
  async ({ app, id }: calendarAppContext) => {
    if (app.user) {
      try {
        const ianaTimeZones = findIana(app.user?.timeZone!);
        const events = await getUserWeekCalendar(
          app.authProvider!,
          ianaTimeZones[0].valueOf(),
          id
        );
        return events;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

export function postEventData(event: Event, calendar: string | undefined) {
  return defaultPostHandler(postEvent, POST_EVENT_DATA, event, calendar)
}

export function patchEventData(event: Event) {
  return defaultPatchHandler(patchEvent, PATCH_EVENT_DATA, false, event)
}

export function deleteEventData(eventId: string) {
  return defaultDeleteHandler(deleteEvent, DELETE_EVENT_DATA, eventId)
}

export function fetchUserCalenders() {
  return defaultFetchHandler(getUserCalendars, FETCH_USER_CALENDER_DATA);
}

type CalendarDataParams = {
  updateCalendar?: string;
  id?: string;
};

export function patchCalendarData({ id, updateCalendar }: CalendarDataParams) {
  return defaultPatchHandler(
    patchUserCalendar,
    PATCH_CALENDAR_DATA,
    false,
    id,
    updateCalendar
  );
}

export function postUserCalendar(calendarName: string) {
  return defaultPostHandler(
    createUserCalendar,
    POST_CALENDAR_DATA,
    calendarName
  );
}

export function deleteCalendarData(id: string) {
  return defaultDeleteHandler(
    deleteUserCalendar,
    DELETE_CALENDAR_DATA,
    id
  );
}