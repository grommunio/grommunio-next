// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Calendar, Event } from "microsoft-graph";
import {
  deleteEvent,
  patchEvent,
  postEvent,
  getUserCalendars,
  patchUserCalendar,
  createUserCalendar,
  deleteUserCalendar,
  getEvents,
  respondToEvent,
  getRecurringEventInstances,
  uploadAttachment,
  eventAttachments
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
import { pushAlertStack } from "./alerts";
import { EventReponseType } from "../types/calendar";
import { fileToBase64 } from "../utils";

export function fetchEventsData(calendar?: Calendar | undefined, add=true) {
  return async (dispatch: any) => {
    if(!add) {
      await dispatch({ 
        type: FETCH_EVENTS_DATA, 
        calendar: calendar,
        add: false
      });
      return [];
    }
    try {
      const data = await getEvents(calendar?.id);
      const occurenceEvents = [];
      let length = data.length;
      for(let i = 0; i < length; i++) {
        const e = data[i];
        if(e.recurrence) {
          try {
            const occurences = await getRecurringEventInstances(e, calendar?.id);
            data.splice(i, 1);
            length--;
            occurenceEvents.push(...occurences);
          } catch (err) {
            console.error(err);
          }
        }
      }
      await dispatch({ 
        type: FETCH_EVENTS_DATA, 
        payload: [...data, ...occurenceEvents],
        calendar: calendar,
        add
      });
      return data;
    } catch (error) {
      await dispatch(pushAlertStack({ message: (error as any)?.message || "", severity: "error" }));
      return false;
    }
  }
}

export function fetchEventAttachments(event: Event) {
  return defaultFetchHandler(eventAttachments, null, event);
}

export function postEventData(event: Event, calendar: string | undefined) {
  return defaultPostHandler(postEvent, POST_EVENT_DATA, event, calendar)
}

export function postEventAttachments(event: Event, attachments: FileList | []) {
  return async (dispatch: any) => {
    try {
      for(let i = 0; i < attachments.length; i++) {
        const attachmentData = {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachments[i].name,
          contentBytes: (await fileToBase64(attachments[i])).split("base64,")[1],
        }
        await uploadAttachment(event.id || "", attachmentData);
      }
    } catch (error) {
      await dispatch(pushAlertStack({ message: (error as any)?.message || "", severity: "error" }));
      return false;
    }
  }
}

export function patchEventData(event: Event) {
  return defaultPatchHandler(patchEvent, PATCH_EVENT_DATA, false, event)
}

export function deleteEventData(eventId: string) {
  return defaultDeleteHandler(deleteEvent, DELETE_EVENT_DATA, eventId)
}

export function fetchUserCalendars() {
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

export function respondToEventMessage(eventId: string, response: EventReponseType) {
  return defaultDeleteHandler(respondToEvent, null, eventId, response)
}
