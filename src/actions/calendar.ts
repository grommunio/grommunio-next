// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Event, Calendar } from "microsoft-graph";
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

type postEventDataParams = {
  event: Event;
};
export function postEventData(event: Event) {
  return defaultPostHandler(
    postEvent,
    POST_EVENT_DATA,
    ...[formatEvent(event)]
  );
}

export const patchEventData = createAsyncThunk<
  Event | boolean,
  postEventDataParams
>(PATCH_EVENT_DATA, async ({ event }: postEventDataParams) => {
  try {
    const res = await patchEvent(formatEvent(event));
    return res;
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return false;
  }
  return false;
});

type deleteEventDataParams = {
  eventId: string;
};

export const deleteEventData = createAsyncThunk<
  Event | boolean,
  deleteEventDataParams
>(PATCH_EVENT_DATA, async ({ eventId }: deleteEventDataParams) => {
  try {
    const res = await deleteEvent(eventId);
    return res;
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return false;
  }
  return false;
});

function formatEvent(rawEvent: any): Event {
  const { id, subject, location, notes, startDate, endDate, timezone } =
    rawEvent;
  return {
    id,
    subject,
    body: {
      contentType: "text",
      content: notes,
    },
    start: {
      dateTime: startDate,
      timeZone: "America/Los_Angeles", // TODO: Remove hardcoded timezone
    },
    end: {
      dateTime: endDate,
      timeZone: "America/Los_Angeles", // TODO: Remove hardcoded timezone
    },
    location: {
      displayName: location,
    },
  };
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
    "updated sucessfully",
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
    PATCH_CALENDAR_DATA,
    id
  );
}