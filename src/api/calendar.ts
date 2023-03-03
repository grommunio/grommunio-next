// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

// <GetUserSnippet>
import { GraphRequestOptions, PageCollection, PageIterator } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { endOfWeek, startOfWeek } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { Event } from 'microsoft-graph';
import { ensureClient, graphClient } from './utils';


// <GetUserWeekCalendarSnippet>
export async function getUserWeekCalendar(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  timeZone: string): Promise<Event[]> {
  ensureClient(authProvider);

  // Generate startDateTime and endDateTime query params
  // to display a 7-day window
  const now = new Date();
  const startDateTime = zonedTimeToUtc(startOfWeek(now), timeZone).toISOString();
  const endDateTime = zonedTimeToUtc(endOfWeek(now), timeZone).toISOString();

  // GET /me/calendarview?startDateTime=''&endDateTime=''
  // &$select=subject,organizer,start,end
  // &$orderby=start/dateTime
  // &$top=50
  const response: PageCollection = await graphClient!
    .api('/me/calendarview')
    .header('Prefer', `outlook.timezone="${timeZone}"`)
    .query({ startDateTime: startDateTime, endDateTime: endDateTime })
    .orderby('start/dateTime')
    .top(25)
    .get();

  if (response["@odata.nextLink"]) {
    // Presence of the nextLink property indicates more results are available
    // Use a page iterator to get all results
    const events: Event[] = [];

    // Must include the time zone header in page
    // requests too
    const options: GraphRequestOptions = {
      headers: { 'Prefer': `outlook.timezone="${timeZone}"` }
    };

    const pageIterator = new PageIterator(graphClient!, response, (event) => {
      events.push(event);
      return true;
    }, options);

    await pageIterator.iterate();

    return events;
  } else {

    return response.value;
  }
}
// </GetUserWeekCalendarSnippet>

// <CreateEventSnippet>
export async function postEvent(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  newEvent: Event): Promise<Event> {
  ensureClient(authProvider);

  // POST /me/events
  // JSON representation of the new event is sent in the
  // request body
  return await graphClient!
    .api('/me/events')
    .post(newEvent);
}

export async function patchEvent(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  event: Event): Promise<Event> {
  ensureClient(authProvider);

  return await graphClient!
    .api('/me/events/' + event.id)
    .patch(event);
}

export async function deleteEvent(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  event: string): Promise<Event> {
  ensureClient(authProvider);

  return await graphClient!
    .api('/me/events/' + event)
    .delete();
}

