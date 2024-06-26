// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

// <GetUserSnippet>
import {
  PageCollection,
} from "@microsoft/microsoft-graph-client";
import {  Attachment, Event } from "microsoft-graph";
import { graphClient } from "./utils";
import { EventReponseType } from "../types/calendar";
import moment from "moment";

export async function getEvents(calendarId?: string | undefined): Promise<Event[]> {
  const response: PageCollection = await graphClient!.api(calendarId ? `/me/calendars/${calendarId}/events` : "/me/events")
    .top(100)
    .get();
  return response.value;
}

export async function eventAttachments(event: Event): Promise<Attachment[]> {
  const response: PageCollection = await graphClient!.api(`/me/events/${event.id}/attachments`)
    .top(100)
    .get();
  return response.value;
}

export async function getRecurringEventInstances(event: Event, calendarId?: string | undefined): Promise<Event[]> {
  let endDate = event.recurrence?.range?.endDate;
  const start = moment(event.start?.dateTime);

  // No enddate specified, calculate reasonable enddate based on pattern
  if (!endDate || endDate === "0001-01-01") {
    const type = event.recurrence?.pattern?.type || "absoluteYearly";
    const clone = start.clone();
    if (type === "daily") clone.add(3, "months");
    else if (type === "weekly") clone.add(24, "weeks");
    else if (type.includes("Yearly")) clone.add(5, "years");
    else clone.add(1, "years");
    
    endDate = clone.toISOString();
  }

  const response: PageCollection = await graphClient!.api((calendarId ?
    `/me/calendars/${calendarId}/events` : "/me/events") + "/" + event.id + "/instances?" +
     `startDateTime=${event.start?.dateTime}&endDateTime=${endDate}T23:59:59.0000000`)
    .top(100)
    .get();
  return response.value;
}

export async function postEvent(newEvent: Event, calendarId: string | undefined): Promise<Event> {
  // POST /me/events
  // JSON representation of the new event is sent in the
  // request body
  return await graphClient!.api(calendarId ? `/me/calendars/${calendarId}/events` : "/me/events").post(newEvent);
}

export async function patchEvent(event: Event): Promise<Event> {
  return await graphClient!.api("/me/events/" + event.id).patch(event);
}

export async function deleteEvent(event: string): Promise<Event> {
  return await graphClient!.api("/me/events/" + event).delete();
}

export async function getUserCalendars(): Promise<Event[]> {
  const response: PageCollection = await graphClient!.api("/me/calendars")
    .get();
  return response.value;
}

export async function patchUserCalendar(
  id?: string,
  calendar?: string
): Promise<Event[]> {
  return await graphClient!.api(`/me/calendars/${id}`).patch({
    name: calendar,
  });
}

export async function createUserCalendar(calendarName: string): Promise<Event> {
  return await graphClient!.api("/me/calendars/").post({
    name: calendarName,
  });
}

export async function deleteUserCalendar(id?: string): Promise<Event> {
  return await graphClient!.api(`/me/calendars/${id}`).delete();
}

export async function respondToEvent(eventId: string, response: EventReponseType): Promise<Event> {
  return await graphClient!.api(`/me/events/${eventId}/${response}`).post(null);
}

export async function getEventFromEventMessage(eventMsgId: string) {
  return await graphClient!.api(`/me/messages/${eventMsgId}`)
    .expand("microsoft.graph.eventMessage/Event")
    .get();
}

export async function uploadAttachment(eventId: string, attachment: Attachment): Promise<Event> {
  return await graphClient!.api(`/me/events/${eventId}/attachments`).post(attachment);
}
