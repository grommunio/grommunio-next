// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

// <GetUserSnippet>
import {
  GraphRequestOptions,
  PageCollection,
  PageIterator,
} from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { startOfMonth, endOfMonth } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";
import {  Event } from "microsoft-graph";
import { graphClient } from "./utils";
import { EventReponseType } from "../types/calendar";

// <GetUserWeekCalendarSnippet>
export async function getUserWeekCalendar(
  authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  timeZone: string,
  id?: string
): Promise<Event[]> {
  // Generate startDateTime and endDateTime query params
  // to display a 7-day window
  const now = new Date();
  const startDateTime = zonedTimeToUtc(
    startOfMonth(now),
    timeZone
  ).toISOString();
  const endDateTime = zonedTimeToUtc(endOfMonth(now), timeZone).toISOString();

  // GET /me/calendarview?startDateTime=''&endDateTime=''
  // &$select=subject,organizer,start,end
  // &$orderby=start/dateTime
  // &$top=50

  const response: PageCollection = await graphClient!
    .api(id ? `/me/calendars/${id}/calendarview` : `/me/calendarview`)
    .header("Prefer", `outlook.timezone="${timeZone}"`)
    .query({ startDateTime: startDateTime, endDateTime: endDateTime })
    .orderby("start/dateTime")
    .top(25)
    .get();

  if (response["@odata.nextLink"]) {
    // Presence of the nextLink property indicates more results are available
    // Use a page iterator to get all results
    const events: Event[] = [];

    // Must include the time zone header in page
    // requests too
    const options: GraphRequestOptions = {
      headers: { Prefer: `outlook.timezone="${timeZone}"` },
    };

    const pageIterator = new PageIterator(
      graphClient!,
      response,
      (event) => {
        events.push(event);
        return true;
      },
      options
    );

    await pageIterator.iterate();

    return events;
  } else {
    return response.value;
  }
}
// </GetUserWeekCalendarSnippet>

export async function getEvents(calendarId?: string | undefined): Promise<Event[]> {
  const response: PageCollection = await graphClient!
    .api(calendarId ? `/me/calendars/${calendarId}/events` : "/me/events")
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
  const response: PageCollection = await graphClient!
    .api("/me/calendars")
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
