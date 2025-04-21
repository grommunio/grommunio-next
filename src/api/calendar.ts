// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { Attachment, Calendar, CalendarGroup, CalendarPermission, Event, ScheduleInformation } from "microsoft-graph";
import { del, get, getAll, patch, post } from "./graph";
import { EventReponseType } from "../types/calendar";
import { fileToBase64 } from "../utils";

export const EVENT_SELECT = [
  "id", "subject", "bodyPreview", "start", "end", "isAllDay", "isCancelled", "isOrganizer", "organizer",
  "attendees", "location", "locations", "recurrence", "seriesMasterId", "type", "showAs", "sensitivity",
  "importance", "categories", "responseStatus", "responseRequested", "hideAttendees", "isReminderOn",
  "reminderMinutesBeforeStart", "hasAttachments", "webLink", "onlineMeeting", "isOnlineMeeting",
  "onlineMeetingUrl", "iCalUId", "lastModifiedDateTime", "originalStartTimeZone", "originalEndTimeZone",
];

const eventsBase = (calendarId?: string) => calendarId ? `/me/calendars/${calendarId}/events` : "/me/events";

// Graph expands recurring series for us
export async function getCalendarView(calendarId: string | undefined, start: string, end: string, timeZone?: string): Promise<Event[]> {
  const base = calendarId ? `/me/calendars/${calendarId}/calendarView` : "/me/calendarView";
  const path = `${base}?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`;
  return getAll<Event>(path, {
    select: EVENT_SELECT,
    orderby: "start/dateTime",
    top: 250,
    headers: timeZone ? { Prefer: `outlook.timezone="${timeZone}"` } : undefined,
  });
}

/** @deprecated use getCalendarView */
export async function getEvents(calendarId?: string | undefined): Promise<Event[]> {
  const response: PageCollection = await get(eventsBase(calendarId), { top: 100 });
  return response.value;
}

export async function getEvent(eventId: string, timeZone?: string): Promise<Event> {
  return get<Event>(`/me/events/${eventId}`, {
    headers: timeZone ? { Prefer: `outlook.timezone="${timeZone}"` } : undefined,
  });
}

export async function eventAttachments(event: Event): Promise<Attachment[]> {
  const response: PageCollection = await get(`/me/events/${event.id}/attachments`, {
    select: ["id", "name", "contentType", "size", "isInline"],
    top: 100,
  });
  return response.value;
}

/** @deprecated use getCalendarView */
export async function getRecurringEventInstances(event: Event, calendarId?: string | undefined): Promise<Event[]> {
  const start = event.start?.dateTime || new Date().toISOString();
  let endDate = event.recurrence?.range?.endDate;
  if (!endDate || endDate === "0001-01-01") {
    const d = new Date(start);
    d.setFullYear(d.getFullYear() + 1);
    endDate = d.toISOString();
  }
  const response: PageCollection = await get(`${eventsBase(calendarId)}/${event.id}/instances?startDateTime=${start}&endDateTime=${endDate}`, { top: 100 });
  return response.value;
}

export async function postEvent(newEvent: Event, calendarId: string | undefined): Promise<Event> {
  return post<Event>(eventsBase(calendarId), newEvent);
}

export async function patchEvent(event: Event): Promise<Event> {
  const { id, ...props } = event;
  return patch<Event>("/me/events/" + id, props);
}

export async function deleteEvent(eventId: string): Promise<void> {
  return del("/me/events/" + eventId);
}

export async function cancelEvent(eventId: string, comment?: string): Promise<void> {
  await post(`/me/events/${eventId}/cancel`, { comment: comment || "" });
}

export async function forwardEvent(eventId: string, recipients: string[], comment?: string): Promise<void> {
  await post(`/me/events/${eventId}/forward`, {
    toRecipients: recipients.map(address => ({ emailAddress: { address } })),
    comment: comment || "",
  });
}

export type RespondOptions = {
  comment?: string;
  sendResponse?: boolean;
  proposedNewTime?: { start: { dateTime: string; timeZone: string }; end: { dateTime: string; timeZone: string } };
};

export async function respondToEvent(eventId: string, response: EventReponseType, options: RespondOptions = {}): Promise<void> {
  await post(`/me/events/${eventId}/${response}`, {
    comment: options.comment || "",
    sendResponse: options.sendResponse !== false,
    ...(options.proposedNewTime ? { proposedNewTime: options.proposedNewTime } : {}),
  });
}

export async function getEventFromEventMessage(eventMsgId: string) {
  return get<any>(`/me/messages/${eventMsgId}`, { expand: "microsoft.graph.eventMessage/event" });
}

export async function uploadAttachment(eventId: string, attachment: Attachment): Promise<Attachment> {
  return post<Attachment>(`/me/events/${eventId}/attachments`, attachment);
}

export async function addEventFileAttachment(eventId: string, file: File): Promise<Attachment> {
  return uploadAttachment(eventId, {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: file.name,
    contentType: file.type || "application/octet-stream",
    contentBytes: (await fileToBase64(file)).split("base64,")[1],
  } as Attachment);
}

export async function deleteEventAttachment(eventId: string, attachmentId: string): Promise<void> {
  return del(`/me/events/${eventId}/attachments/${attachmentId}`);
}

const CALENDAR_SELECT = ["id", "name", "color", "hexColor", "isDefaultCalendar", "canEdit", "canShare", "canViewPrivateItems", "owner", "isRemovable", "changeKey"];

export async function getUserCalendars(): Promise<Calendar[]> {
  return getAll<Calendar>("/me/calendars", { select: CALENDAR_SELECT, top: 100 });
}

export async function getCalendarGroups(): Promise<CalendarGroup[]> {
  return getAll<CalendarGroup>("/me/calendarGroups");
}

export async function patchUserCalendar(id?: string, calendar?: string | Partial<Calendar>): Promise<Calendar> {
  const body = typeof calendar === "string" ? { name: calendar } : calendar;
  return patch<Calendar>(`/me/calendars/${id}`, body);
}

export async function createUserCalendar(calendarName: string | Partial<Calendar>): Promise<Calendar> {
  const body = typeof calendarName === "string" ? { name: calendarName } : calendarName;
  return post<Calendar>("/me/calendars", body);
}

export async function deleteUserCalendar(id?: string): Promise<void> {
  return del(`/me/calendars/${id}`);
}

export async function getCalendarPermissions(calendarId: string): Promise<CalendarPermission[]> {
  return getAll<CalendarPermission>(`/me/calendars/${calendarId}/calendarPermissions`);
}

export async function createCalendarPermission(calendarId: string, permission: CalendarPermission): Promise<CalendarPermission> {
  return post<CalendarPermission>(`/me/calendars/${calendarId}/calendarPermissions`, permission);
}

export async function updateCalendarPermission(calendarId: string, permissionId: string, role: string): Promise<CalendarPermission> {
  return patch<CalendarPermission>(`/me/calendars/${calendarId}/calendarPermissions/${permissionId}`, { role });
}

export async function deleteCalendarPermission(calendarId: string, permissionId: string): Promise<void> {
  return del(`/me/calendars/${calendarId}/calendarPermissions/${permissionId}`);
}

export async function getSchedule(addresses: string[], start: string, end: string, timeZone: string, interval = 30): Promise<ScheduleInformation[]> {
  const response = await post<{ value: ScheduleInformation[] }>("/me/calendar/getSchedule", {
    schedules: addresses,
    startTime: { dateTime: start, timeZone },
    endTime: { dateTime: end, timeZone },
    availabilityViewInterval: interval,
  }, { headers: { Prefer: `outlook.timezone="${timeZone}"` } });
  return response.value;
}
